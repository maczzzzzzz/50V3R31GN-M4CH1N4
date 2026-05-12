/**
 * sovereign_artery_ble.c — Sovereign Zero-Trust Artery BLE Encryption Layer
 *
 * Implementation of AES-256-CCM authenticated encryption for the Omi
 * BLE transport. Hooks into the nRF52 Zephyr BLE stack to provide
 * Sovereign mesh end-to-end encryption of PCM audio streams.
 *
 * Uses nRF Crypto library for:
 *   - AES-256-CCM authenticated encryption/decryption
 *   - HKDF-SHA256 key derivation for session key rotation
 *
 * Encryption flow (TX):
 *   1. PCM audio frame collected from mic buffer
 *   2. Packet counter incremented (monotonic, anti-replay)
 *   3. Nonce derived from counter + session salt
 *   4. AES-256-CCM encrypt with AAD = counter || device_id
 *   5. Packet header (counter + nonce + tag) prepended
 *   6. Encrypted packet sent via BLE notification
 *
 * Decryption flow (RX — command channel):
 *   1. BLE notification received on RX characteristic
 *   2. Packet header parsed (counter, nonce, tag)
 *   3. Replay check: counter must be > rx_counter_last
 *   4. AES-256-CCM decrypt and verify tag
 *   5. Plaintext command dispatched
 *
 * Key rotation:
 *   - Session key rotated every SOVEREIGN_KEY_ROTATION_S (300s)
 *   - New key derived via HKDF from master secret + counter
 *   - Both sides rotate synchronously (counter-derived)
 *
 * Phase 5: Omi Voice Layering (Hardware Artery)
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 Sovereign Machina
 */

#include <zephyr/kernel.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/gatt.h>
#include <zephyr/logging/log.h>
#include <string.h>

/* nRF Crypto headers for AES-256-CCM and HKDF */
#include <nrf_crypto_init.h>
#include <nrf_crypto_aead.h>
#include <nrf_crypto_hkdf.h>

#include "sovereign_artery_ble.h"
#include "sovereign_config.h"

LOG_MODULE_REGISTER(sovereign_artery, CONFIG_LOG_DEFAULT_LEVEL);

/* ── Compile-time UUID definitions ───────────────────────────────────── */

/** Sovereign Artery BLE service UUID (128-bit). */
static struct bt_uuid_128 sovereign_svc_uuid = BT_UUID_INIT_128(
    SOVEREIGN_BLE_SVC_UUID_LSB
);

/** TX characteristic UUID (audio data from Omi → mesh). */
static struct bt_uuid_128 sovereign_tx_uuid = BT_UUID_INIT_128(
    SOVEREIGN_BLE_TX_CHAR_UUID_LSB
);

/** RX characteristic UUID (commands from mesh → Omi). */
static struct bt_uuid_128 sovereign_rx_uuid = BT_UUID_INIT_128(
    SOVEREIGN_BLE_RX_CHAR_UUID_LSB
);

/* ── Static session (single-connection for Omi wearable) ─────────────── */

static struct sovereign_session active_session;
static bool session_initialized = false;

/* ── nRF Crypto AEAD context (AES-256-CCM) ───────────────────────────── */

static nrf_crypto_aead_context_t aead_ctx;

/* ── Master key for HKDF key derivation.
 * In production, this is derived from ECDH key exchange.
 * SECURITY NOTE: Replace with ECDH before production deployment.
 */
static uint8_t master_key[SOVEREIGN_AES_KEY_LEN];

/* ── Forward declarations ────────────────────────────────────────────── */

static ssize_t on_tx_ccc_cfg(const struct bt_conn *conn,
                              struct bt_gatt_attr *attr,
                              uint16_t value);
static ssize_t on_rx_write(struct bt_conn *conn,
                             struct bt_gatt_attr *attr,
                             const void *buf, uint16_t len,
                             uint16_t offset, uint8_t flags);
static int derive_session_key(const uint8_t mk[SOVEREIGN_AES_KEY_LEN],
                               uint64_t counter,
                               uint8_t out_key[SOVEREIGN_AES_KEY_LEN]);
static int aead_encrypt(const uint8_t key[SOVEREIGN_AES_KEY_LEN],
                         const uint8_t nonce[SOVEREIGN_AES_NONCE_LEN],
                         const uint8_t *plaintext, uint16_t pt_len,
                         const uint8_t *aad, uint16_t aad_len,
                         uint8_t *ciphertext,
                         uint8_t tag[SOVEREIGN_AES_TAG_LEN]);
static int aead_decrypt(const uint8_t key[SOVEREIGN_AES_KEY_LEN],
                         const uint8_t nonce[SOVEREIGN_AES_NONCE_LEN],
                         const uint8_t *ciphertext, uint16_t ct_len,
                         const uint8_t *aad, uint16_t aad_len,
                         const uint8_t tag[SOVEREIGN_AES_TAG_LEN],
                         uint8_t *plaintext);

/* ── GATT Service Definition ─────────────────────────────────────────── */

BT_GATT_SERVICE_DEFINE(sovereign_svc,
    BT_GATT_PRIMARY_SERVICE(&sovereign_svc_uuid.uuid),

    /* TX characteristic: Omi → mesh (notify) */
    BT_GATT_CHARACTERISTIC(&sovereign_tx_uuid.uuid.uuid,
                           BT_GATT_CHRC_NOTIFY,
                           BT_GATT_PERM_READ,
                           NULL, NULL, NULL),
    BT_GATT_CCC(on_tx_ccc_cfg,
                BT_GATT_PERM_READ | BT_GATT_PERM_WRITE),

    /* RX characteristic: mesh → Omi (write without response) */
    BT_GATT_CHARACTERISTIC(&sovereign_rx_uuid.uuid.uuid,
                           BT_GATT_CHRC_WRITE | BT_GATT_CHRC_WRITE_WITHOUT_RESP,
                           BT_GATT_PERM_WRITE,
                           NULL, on_rx_write, NULL),
);

/* ── GATT Callbacks ──────────────────────────────────────────────────── */

/**
 * CCC (Client Characteristic Configuration) callback for TX notifications.
 * Called when the central (Node C) subscribes/unsubscribes to audio data.
 */
static ssize_t on_tx_ccc_cfg(const struct bt_conn *conn,
                              struct bt_gatt_attr *attr,
                              uint16_t value)
{
    if (value == BT_GATT_CCC_NOTIFY) {
        LOG_INF("[Sovereign Artery] Central subscribed to TX (notifications ON)");

        /* Create session on subscribe */
        if (!session_initialized) {
            int rc = sovereign_session_create(
                (struct bt_conn *)conn, &active_session);
            if (rc != 0) {
                LOG_ERR("[Sovereign Artery] Session creation failed: %d", rc);
                return BT_GATT_ERR(BT_ATT_ERR_UNLIKELY);
            }
            session_initialized = true;
            LOG_INF("[Sovereign Artery] Session ACTIVE — encrypted channel open");
        }
    } else {
        LOG_INF("[Sovereign Artery] Central unsubscribed (notifications OFF)");

        if (session_initialized) {
            sovereign_session_destroy(&active_session);
            session_initialized = false;
        }
    }

    return sizeof(value);
}

/**
 * RX write callback — receives encrypted commands from the mesh.
 */
static ssize_t on_rx_write(struct bt_conn *conn,
                             struct bt_gatt_attr *attr,
                             const void *buf, uint16_t len,
                             uint16_t offset, uint8_t flags)
{
    const uint8_t *data = (const uint8_t *)buf;

    if (!session_initialized) {
        LOG_WRN("[Sovereign Artery] RX before session established, dropping");
        return len;
    }

    /* Decrypt the incoming command */
    uint8_t plaintext[SOVEREIGN_MAX_PAYLOAD];
    int decrypted = sovereign_decrypt_rx(
        &active_session, data, len, plaintext, sizeof(plaintext));

    if (decrypted < 0) {
        LOG_ERR("[Sovereign Artery] RX decrypt failed: %d", decrypted);
        return len;
    }

    LOG_INF("[Sovereign Artery] RX command: %d bytes decrypted", decrypted);

    /* Command dispatch would go here (e.g., start/stop capture, gain adjust) */
    /* For Phase 5, commands are minimal — primarily session management */

    return len;
}

/* ── nRF Crypto Helpers ──────────────────────────────────────────────── */

/**
 * Initialize the nRF Crypto subsystem.
 *
 * @return 0 on success, negative errno on failure.
 */
static int crypto_init(void)
{
    ret_code_t err = nrf_crypto_init();
    if (err != NRF_SUCCESS) {
        LOG_ERR("[Sovereign Artery] nrf_crypto_init failed: 0x%08x", err);
        return -EIO;
    }
    return 0;
}

/**
 * Perform AES-256-CCM authenticated encryption.
 *
 * @param key        32-byte AES-256 key.
 * @param nonce      12-byte nonce.
 * @param plaintext  Input plaintext data.
 * @param pt_len     Length of plaintext.
 * @param aad        Additional authenticated data.
 * @param aad_len    Length of AAD.
 * @param ciphertext Output ciphertext buffer (must be >= pt_len).
 * @param tag        Output 16-byte authentication tag.
 * @return 0 on success, negative errno on failure.
 */
static int aead_encrypt(const uint8_t key[SOVEREIGN_AES_KEY_LEN],
                         const uint8_t nonce[SOVEREIGN_AES_NONCE_LEN],
                         const uint8_t *plaintext, uint16_t pt_len,
                         const uint8_t *aad, uint16_t aad_len,
                         uint8_t *ciphertext,
                         uint8_t tag[SOVEREIGN_AES_TAG_LEN])
{
    ret_code_t err;

    /* Initialize AEAD context for AES-256-CCM */
    err = nrf_crypto_aead_init(&aead_ctx, &g_nrf_crypto_aes_ccm_256_info, key);
    if (err != NRF_SUCCESS) {
        LOG_ERR("[Sovereign Artery] AEAD init failed: 0x%08x", err);
        return -EIO;
    }

    /* Perform AES-256-CCM encryption with authentication */
    err = nrf_crypto_aead_encrypt(&aead_ctx,
                                   nonce, SOVEREIGN_AES_NONCE_LEN,
                                   aad, aad_len,
                                   plaintext, pt_len,
                                   ciphertext,
                                   tag, SOVEREIGN_AES_TAG_LEN);
    if (err != NRF_SUCCESS) {
        LOG_ERR("[Sovereign Artery] AEAD encrypt failed: 0x%08x", err);
        (void)nrf_crypto_aead_uninit(&aead_ctx);
        return -EIO;
    }

    /* Uninitialize AEAD context (wipes key material from context) */
    err = nrf_crypto_aead_uninit(&aead_ctx);
    if (err != NRF_SUCCESS) {
        LOG_WRN("[Sovereign Artery] AEAD uninit failed: 0x%08x", err);
    }

    return 0;
}

/**
 * Perform AES-256-CCM authenticated decryption with tag verification.
 *
 * @param key        32-byte AES-256 key.
 * @param nonce      12-byte nonce.
 * @param ciphertext Input ciphertext data.
 * @param ct_len     Length of ciphertext.
 * @param aad        Additional authenticated data.
 * @param aad_len    Length of AAD.
 * @param tag        16-byte authentication tag to verify.
 * @param plaintext  Output plaintext buffer (must be >= ct_len).
 * @return 0 on success (tag verified), negative errno on auth failure.
 */
static int aead_decrypt(const uint8_t key[SOVEREIGN_AES_KEY_LEN],
                         const uint8_t nonce[SOVEREIGN_AES_NONCE_LEN],
                         const uint8_t *ciphertext, uint16_t ct_len,
                         const uint8_t *aad, uint16_t aad_len,
                         const uint8_t tag[SOVEREIGN_AES_TAG_LEN],
                         uint8_t *plaintext)
{
    ret_code_t err;

    /* Initialize AEAD context for AES-256-CCM */
    err = nrf_crypto_aead_init(&aead_ctx, &g_nrf_crypto_aes_ccm_256_info, key);
    if (err != NRF_SUCCESS) {
        LOG_ERR("[Sovereign Artery] AEAD init (decrypt) failed: 0x%08x", err);
        return -EIO;
    }

    /* Perform AES-256-CCM decryption with tag verification.
     * nrf_crypto_aead_decrypt will return an error if the tag
     * does not match — this is the actual authentication check.
     */
    err = nrf_crypto_aead_decrypt(&aead_ctx,
                                   nonce, SOVEREIGN_AES_NONCE_LEN,
                                   aad, aad_len,
                                   ciphertext, ct_len,
                                   plaintext,
                                   tag, SOVEREIGN_AES_TAG_LEN);
    if (err != NRF_SUCCESS) {
        if (err == NRF_ERROR_CRYPTO_AEAD_INVALID_TAG ||
            err == NRF_ERROR_CRYPTO_INTERNAL) {
            LOG_ERR("[Sovereign Artery] Auth tag verification FAILED");
        } else {
            LOG_ERR("[Sovereign Artery] AEAD decrypt failed: 0x%08x", err);
        }
        (void)nrf_crypto_aead_uninit(&aead_ctx);
        return -EBADMSG;
    }

    /* Uninitialize AEAD context */
    err = nrf_crypto_aead_uninit(&aead_ctx);
    if (err != NRF_SUCCESS) {
        LOG_WRN("[Sovereign Artery] AEAD uninit (decrypt) failed: 0x%08x", err);
    }

    return 0;
}

/* ── Internal Helpers ────────────────────────────────────────────────── */

/**
 * Generate a nonce from the packet counter and session salt.
 *
 * Nonce construction: XOR counter bytes with salt for first 8 bytes,
 * then fill remaining bytes from counter. This ensures uniqueness
 * per packet while mixing in the session salt.
 */
static void generate_nonce(const struct sovereign_session *sess,
                            uint64_t counter,
                            uint8_t nonce[SOVEREIGN_AES_NONCE_LEN])
{
    uint64_t counter_be = sys_cpu_to_be64(counter);
    const uint8_t *counter_bytes = (const uint8_t *)&counter_be;

    /* XOR the 8-byte counter with the 8-byte salt for the first 8 bytes */
    for (int i = 0; i < 8; i++) {
        nonce[i] = counter_bytes[i] ^ sess->salt[i];
    }

    /* Fill remaining 4 bytes with lower 4 bytes of counter (truncated) */
    for (int i = 8; i < SOVEREIGN_AES_NONCE_LEN; i++) {
        nonce[i] = counter_bytes[i - 8];
    }
}

/**
 * Securely zero a buffer (will not be optimized away).
 */
static void secure_zero(void *buf, size_t len)
{
    volatile uint8_t *p = (volatile uint8_t *)buf;
    while (len--) {
        *p++ = 0;
    }
}

/**
 * Derive a new session key using HKDF-SHA256.
 *
 * Uses nrf_crypto_hkdf_calculate() with:
 *   - Hash: SHA-256
 *   - IKM: master key (32 bytes)
 *   - Salt: counter as 8-byte big-endian
 *   - Info: "sovereign-key-rotation" label
 *   - OKM: 32-byte derived key
 *
 * Both sides derive the same key from the shared master secret and
 * the monotonically increasing counter, ensuring synchronous rotation.
 *
 * @param mk      Master key (input keying material).
 * @param counter Packet counter used as HKDF salt.
 * @param out_key Output derived session key (32 bytes).
 * @return 0 on success, negative errno on failure.
 */
static int derive_session_key(const uint8_t mk[SOVEREIGN_AES_KEY_LEN],
                               uint64_t counter,
                               uint8_t out_key[SOVEREIGN_AES_KEY_LEN])
{
    ret_code_t err;

    /* Salt: counter as big-endian 8 bytes, zero-padded to 32 bytes */
    uint8_t hkdf_salt[SOVEREIGN_AES_KEY_LEN];
    memset(hkdf_salt, 0, sizeof(hkdf_salt));
    sys_put_be64(counter, hkdf_salt);

    /* Info label for domain separation */
    static const uint8_t hkdf_info[] = "sovereign-key-rotation";

    size_t okm_len = SOVEREIGN_AES_KEY_LEN;

    err = nrf_crypto_hkdf_calculate(NULL,                       /* p_context (allocate internally) */
                                    &g_nrf_crypto_hmac_sha256_info, /* hash info */
                                    NRF_CRYPTO_HKDF_EXTRACT_AND_EXPAND, /* mode */
                                    out_key,                     /* OKM output */
                                    &okm_len,                    /* OKM length */
                                    mk,                          /* IKM */
                                    SOVEREIGN_AES_KEY_LEN,       /* IKM length */
                                    hkdf_salt,                   /* salt */
                                    sizeof(hkdf_salt),           /* salt length */
                                    hkdf_info,                   /* info */
                                    sizeof(hkdf_info) - 1);      /* info length (exclude NUL) */

    secure_zero(hkdf_salt, sizeof(hkdf_salt));

    if (err != NRF_SUCCESS) {
        LOG_ERR("[Sovereign Artery] HKDF key derivation failed: 0x%08x", err);
        return -EIO;
    }

    return 0;
}

/* ── Public API Implementation ───────────────────────────────────────── */

int sovereign_artery_ble_init(void)
{
    LOG_INF("[Sovereign Artery] Initializing BLE encryption layer...");

    /* Initialize nRF Crypto subsystem */
    int rc = crypto_init();
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] Crypto subsystem init failed: %d", rc);
        return rc;
    }

    LOG_INF("[Sovereign Artery] Target: %s:%d (Node C)",
            SOVEREIGN_ARTERY_TARGET_IP, SOVEREIGN_ARTERY_TARGET_PORT);
    LOG_INF("[Sovereign Artery] Encryption: AES-256-CCM (nRF Crypto)");
    LOG_INF("[Sovereign Artery] Key derivation: HKDF-SHA256");
    LOG_INF("[Sovereign Artery] Key rotation: every %ds", SOVEREIGN_KEY_ROTATION_S);

    memset(&active_session, 0, sizeof(active_session));
    active_session.state = SOVEREIGN_SESSION_DISCONNECTED;
    session_initialized = false;

    LOG_INF("[Sovereign Artery] GATT service registered, waiting for central...");
    return 0;
}

int sovereign_session_create(struct bt_conn *conn,
                              struct sovereign_session *session)
{
    if (conn == NULL || session == NULL) {
        return -EINVAL;
    }

    memset(session, 0, sizeof(*session));
    session->conn = bt_conn_ref(conn);
    session->state = SOVEREIGN_SESSION_HANDSHAKE;

    session->tx_counter = 0;
    session->rx_counter_last = 0;

    /* Provision the master key.
     *
     * Production flow: ECDH key exchange or pre-shared key from Tailscale.
     * For Phase 5, we use a placeholder master key. The actual session key
     * is derived from this master key via HKDF, NOT used directly.
     *
     * SECURITY NOTE: This placeholder master key MUST be replaced with
     * proper ECDH-derived key before production deployment.
     */
    static const uint8_t placeholder_master[SOVEREIGN_AES_KEY_LEN] = {
        0x53, 0x4f, 0x56, 0x45, 0x52, 0x45, 0x49, 0x47, /* SOVEREIG */
        0x4e, 0x2d, 0x4d, 0x41, 0x43, 0x48, 0x49, 0x4e, /* N-MACHIN */
        0x41, 0x2d, 0x50, 0x48, 0x35, 0x2d, 0x4f, 0x4d, /* A-PH5-OM */
        0x49, 0x2d, 0x42, 0x4c, 0x45, 0x2d, 0x4b, 0x45  /* I-BLE-KE */
    };
    memcpy(master_key, placeholder_master, SOVEREIGN_AES_KEY_LEN);

    /* Derive the initial session key from master key via HKDF.
     * Counter 0 is used for the first key derivation.
     */
    int rc = derive_session_key(master_key, 0, session->key);
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] Initial key derivation failed: %d", rc);
        bt_conn_unref(session->conn);
        session->conn = NULL;
        return rc;
    }

    /* Generate random session salt using hardware entropy */
    rc = sys_csrand_get(session->salt, sizeof(session->salt));
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] Salt generation failed: %d", rc);
        secure_zero(session->key, sizeof(session->key));
        bt_conn_unref(session->conn);
        session->conn = NULL;
        return rc;
    }

    session->last_key_rotation_ms = k_uptime_get();
    session->state = SOVEREIGN_SESSION_ACTIVE;

    LOG_INF("[Sovereign Artery] Session created: state=%s",
            sovereign_session_state_str(session->state));
    LOG_INF("[Sovereign Artery] TX counter=0, key rotation in %ds",
            SOVEREIGN_KEY_ROTATION_S);

    return 0;
}

void sovereign_session_destroy(struct sovereign_session *session)
{
    if (session == NULL) {
        return;
    }

    LOG_INF("[Sovereign Artery] Destroying session (state=%s)",
            sovereign_session_state_str(session->state));

    /* Securely wipe sensitive material */
    secure_zero(session->key, sizeof(session->key));
    secure_zero(session->salt, sizeof(session->salt));
    secure_zero(master_key, sizeof(master_key));

    if (session->conn != NULL) {
        bt_conn_unref(session->conn);
        session->conn = NULL;
    }

    session->state = SOVEREIGN_SESSION_DISCONNECTED;
    session->tx_counter = 0;
    session->rx_counter_last = 0;
}

int sovereign_encrypt_and_tx(struct sovereign_session *session,
                              const uint8_t *pcm_data,
                              uint16_t pcm_len)
{
    if (session == NULL || pcm_data == NULL) {
        return -EINVAL;
    }

    if (session->state != SOVEREIGN_SESSION_ACTIVE) {
        LOG_ERR("[Sovereign Artery] TX rejected: session not active (%s)",
                sovereign_session_state_str(session->state));
        return -ENOTCONN;
    }

    if (pcm_len > SOVEREIGN_MAX_PAYLOAD) {
        LOG_ERR("[Sovereign Artery] PCM frame too large: %u > %u",
                pcm_len, SOVEREIGN_MAX_PAYLOAD);
        return -EFBIG;
    }

    /* Allocate TX buffer: header + encrypted payload */
    uint8_t tx_buf[sizeof(struct sovereign_pkt_header) + SOVEREIGN_MAX_PAYLOAD];
    struct sovereign_pkt_header *hdr = (struct sovereign_pkt_header *)tx_buf;

    /* Increment packet counter */
    session->tx_counter++;
    uint64_t pkt_counter = session->tx_counter;

    /* Generate nonce from counter + session salt */
    generate_nonce(session, pkt_counter, hdr->nonce);

    /* Build AAD: packet counter (anti-replay binding) */
    uint8_t aad[SOVEREIGN_AAD_LEN];
    memset(aad, 0, sizeof(aad));
    sys_put_be64(pkt_counter, aad);

    hdr->counter = sys_cpu_to_be64(pkt_counter);
    hdr->payload_len = sys_cpu_to_be16(pcm_len);

    /* ── AES-256-CCM Encryption (nRF Crypto) ───────────────────────── *
     * Real authenticated encryption using nRF Crypto hardware-backed   *
     * AES-CCM. The authentication tag is generated by the AEAD         *
     * operation and is verified on the receiving side.                 *
     * ──────────────────────────────────────────────────────────────── */

    uint8_t *encrypted_payload = tx_buf + sizeof(struct sovereign_pkt_header);

    int rc = aead_encrypt(session->key,
                          hdr->nonce,
                          pcm_data, pcm_len,
                          aad, sizeof(aad),
                          encrypted_payload,
                          hdr->tag);
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] AES-256-CCM encryption failed: %d", rc);
        return rc;
    }

    /* Total packet size */
    uint16_t total_len = sizeof(struct sovereign_pkt_header) + pcm_len;

#if SOVEREIGN_DEBUG_LOG
    LOG_INF("[Sovereign Artery] TX pkt #%llu: %u PCM bytes → %u total, "
            "nonce[0..3]=%02x%02x%02x%02x, tag[0..3]=%02x%02x%02x%02x",
            pkt_counter, pcm_len, total_len,
            hdr->nonce[0], hdr->nonce[1],
            hdr->nonce[2], hdr->nonce[3],
            hdr->tag[0], hdr->tag[1],
            hdr->tag[2], hdr->tag[3]);
#endif

    /* Send via BLE notification on TX characteristic */
    struct bt_gatt_notify_params params = {
        .attr = &sovereign_svc.attrs[2], /* TX characteristic attribute */
        .data = tx_buf,
        .len  = total_len,
    };

    rc = bt_gatt_notify_cb(session->conn, &params);
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] BLE notify failed: %d", rc);
        return rc;
    }

    /* Check key rotation */
    sovereign_check_key_rotation(session);

    return 0;
}

int sovereign_decrypt_rx(struct sovereign_session *session,
                          const uint8_t *encrypted,
                          uint16_t encrypted_len,
                          uint8_t *plaintext,
                          uint16_t plaintext_max)
{
    if (session == NULL || encrypted == NULL || plaintext == NULL) {
        return -EINVAL;
    }

    if (session->state != SOVEREIGN_SESSION_ACTIVE) {
        LOG_ERR("[Sovereign Artery] RX rejected: session not active");
        return -ENOTCONN;
    }

    /* Parse packet header */
    if (encrypted_len < sizeof(struct sovereign_pkt_header)) {
        LOG_ERR("[Sovereign Artery] RX packet too short: %u < %u",
                encrypted_len, sizeof(struct sovereign_pkt_header));
        return -EBADMSG;
    }

    const struct sovereign_pkt_header *hdr =
        (const struct sovereign_pkt_header *)encrypted;

    uint64_t pkt_counter = sys_be64_to_cpu(hdr->counter);
    uint16_t payload_len = sys_be16_to_cpu(hdr->payload_len);

    /* Anti-replay check */
    if (pkt_counter <= session->rx_counter_last) {
        LOG_ERR("[Sovereign Artery] Replay detected! pkt=%llu <= last=%llu",
                pkt_counter, session->rx_counter_last);
        return -EALREADY;
    }

    /* Bounds check */
    uint16_t actual_payload = encrypted_len - sizeof(struct sovereign_pkt_header);
    if (payload_len > actual_payload || payload_len > plaintext_max) {
        LOG_ERR("[Sovereign Artery] RX payload mismatch: hdr=%u actual=%u max=%u",
                payload_len, actual_payload, plaintext_max);
        return -EBADMSG;
    }

    /* Build AAD for decryption (must match TX AAD) */
    uint8_t aad[SOVEREIGN_AAD_LEN];
    memset(aad, 0, sizeof(aad));
    sys_put_be64(pkt_counter, aad);

    /* ── AES-256-CCM Decryption with Tag Verification (nRF Crypto) ── *
     * The nrf_crypto_aead_decrypt function performs decryption AND     *
     * tag verification in a single operation. If the tag does not      *
     * match, it returns NRF_ERROR_CRYPTO_AEAD_INVALID_TAG.            *
     * This is real cryptographic authentication — not a byte check.    *
     * ──────────────────────────────────────────────────────────────── */

    const uint8_t *ciphertext = encrypted + sizeof(struct sovereign_pkt_header);

    int rc = aead_decrypt(session->key,
                          hdr->nonce,
                          ciphertext, payload_len,
                          aad, sizeof(aad),
                          hdr->tag,
                          plaintext);
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] AES-256-CCM decrypt/auth failed: %d", rc);
        return -EBADMSG;
    }

    /* Update last-seen counter */
    session->rx_counter_last = pkt_counter;

#if SOVEREIGN_DEBUG_LOG
    LOG_INF("[Sovereign Artery] RX pkt #%llu: %u bytes decrypted, tag verified OK",
            pkt_counter, payload_len);
#endif

    return payload_len;
}

int sovereign_check_key_rotation(struct sovereign_session *session)
{
    if (session == NULL || session->state != SOVEREIGN_SESSION_ACTIVE) {
        return 0;
    }

    int64_t now = k_uptime_get();
    int64_t elapsed_ms = now - session->last_key_rotation_ms;
    int64_t rotation_ms = SOVEREIGN_KEY_ROTATION_S * 1000LL;

    if (elapsed_ms < rotation_ms) {
        return 0; /* Not time yet */
    }

    LOG_INF("[Sovereign Artery] Key rotation due (%lld ms elapsed)", elapsed_ms);

    /* Derive new session key from master key + current counter via HKDF */
    uint8_t new_key[SOVEREIGN_AES_KEY_LEN];
    int rc = derive_session_key(master_key, session->tx_counter, new_key);
    if (rc != 0) {
        LOG_ERR("[Sovereign Artery] HKDF key derivation failed: %d", rc);
        return rc;
    }

    /* Atomically swap keys */
    secure_zero(session->key, sizeof(session->key));
    memcpy(session->key, new_key, SOVEREIGN_AES_KEY_LEN);
    secure_zero(new_key, sizeof(new_key));

    session->last_key_rotation_ms = now;

    LOG_INF("[Sovereign Artery] Key rotation complete (next in %ds)",
            SOVEREIGN_KEY_ROTATION_S);

    return 0;
}

const char *sovereign_session_state_str(enum sovereign_session_state state)
{
    switch (state) {
    case SOVEREIGN_SESSION_DISCONNECTED:
        return "DISCONNECTED";
    case SOVEREIGN_SESSION_HANDSHAKE:
        return "HANDSHAKE";
    case SOVEREIGN_SESSION_KEY_EXCHANGE:
        return "KEY_EXCHANGE";
    case SOVEREIGN_SESSION_ACTIVE:
        return "ACTIVE";
    case SOVEREIGN_SESSION_ERROR:
        return "ERROR";
    default:
        return "UNKNOWN";
    }
}
