/**
 * sovereign_artery_ble.h — Sovereign Zero-Trust Artery BLE Encryption Layer
 *
 * Provides AES-256-CCM encryption/decryption wrappers for the nRF52 BLE
 * transport layer. All audio PCM data transmitted from Omi hardware to
 * the Sovereign mesh (Node C) is encrypted through this module.
 *
 * This module hooks into the existing Omi BLE transport (see src/lib/transport)
 * and wraps TX/RX payloads with:
 *   - Per-packet 64-bit counter (anti-replay)
 *   - AES-256-CCM authenticated encryption
 *   - 12-byte nonce derived from packet counter + session salt
 *   - 16-byte authentication tag
 *
 * Phase 5: Omi Voice Layering (Hardware Artery)
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 Sovereign Machina
 */

#ifndef SOVEREIGN_ARTERY_BLE_H_
#define SOVEREIGN_ARTERY_BLE_H_

#include <zephyr/kernel.h>
#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/uuid.h>
#include <zephyr/bluetooth/gatt.h>
#include <zephyr/sys/byteorder.h>
#include "sovereign_config.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ── Type Definitions ────────────────────────────────────────────────── */

/** Session state for an active Sovereign Artery BLE connection. */
enum sovereign_session_state {
    SOVEREIGN_SESSION_DISCONNECTED = 0,
    SOVEREIGN_SESSION_HANDSHAKE,
    SOVEREIGN_SESSION_KEY_EXCHANGE,
    SOVEREIGN_SESSION_ACTIVE,
    SOVEREIGN_SESSION_ERROR,
};

/** Encrypted packet header prepended to every BLE payload. */
struct __attribute__((packed)) sovereign_pkt_header {
    uint64_t counter;    /**< Monotonic packet counter (anti-replay). */
    uint8_t  nonce[SOVEREIGN_AES_NONCE_LEN]; /**< Per-packet nonce. */
    uint8_t  tag[SOVEREIGN_AES_TAG_LEN];     /**< Authentication tag. */
    uint16_t payload_len; /**< Length of the encrypted payload. */
};

/** Sovereign Artery session context. */
struct sovereign_session {
    enum sovereign_session_state state;

    /** AES-256 session key (rotated per SOVEREIGN_KEY_ROTATION_S). */
    uint8_t key[SOVEREIGN_AES_KEY_LEN];

    /** Session salt mixed into nonce generation. */
    uint8_t salt[8];

    /** Monotonic TX packet counter. */
    uint64_t tx_counter;

    /** Monotonic RX packet counter (last seen, for replay check). */
    uint64_t rx_counter_last;

    /** BLE connection reference. */
    struct bt_conn *conn;

    /** Timestamp of last key rotation (k_uptime_get). */
    int64_t last_key_rotation_ms;
};

/* ── Public API ──────────────────────────────────────────────────────── */

/**
 * Initialize the Sovereign Artery BLE encryption layer.
 *
 * Must be called once during firmware startup, before any BLE connections
 * are established. Registers custom GATT service and characteristic
 * callbacks for the Sovereign encrypted channel.
 *
 * @return 0 on success, negative errno on failure.
 */
int sovereign_artery_ble_init(void);

/**
 * Create a new encrypted session for a BLE connection.
 *
 * Called when a central (Node C) connects and subscribes to the
 * Sovereign Artery characteristic. Performs session key derivation
 * using ECDH (or pre-shared key for initial provisioning).
 *
 * @param conn   BLE connection handle.
 * @param session Output session context (caller-allocated).
 * @return 0 on success, negative errno on failure.
 */
int sovereign_session_create(struct bt_conn *conn,
                              struct sovereign_session *session);

/**
 * Destroy an encrypted session and zero sensitive material.
 *
 * Called on BLE disconnect or session error. Securely wipes the
 * AES key from memory.
 *
 * @param session Session context to destroy.
 */
void sovereign_session_destroy(struct sovereign_session *session);

/**
 * Encrypt and transmit a PCM audio frame over BLE.
 *
 * Takes a raw PCM buffer, encrypts it with AES-256-CCM using the
 * session key, prepends the packet header, and queues it for BLE TX.
 *
 * @param session  Active session context.
 * @param pcm_data Raw PCM audio bytes.
 * @param pcm_len  Length of PCM data in bytes.
 * @return 0 on success, negative errno on failure.
 */
int sovereign_encrypt_and_tx(struct sovereign_session *session,
                              const uint8_t *pcm_data,
                              uint16_t pcm_len);

/**
 * Decrypt a received BLE packet (command channel).
 *
 * Parses the packet header, verifies the authentication tag,
 * checks the replay counter, and decrypts the payload.
 *
 * @param session      Active session context.
 * @param encrypted    Received encrypted packet (including header).
 * @param encrypted_len Total length of encrypted data.
 * @param plaintext    Output buffer for decrypted data.
 * @param plaintext_max Maximum output buffer size.
 * @return Number of decrypted bytes, or negative errno on failure.
 */
int sovereign_decrypt_rx(struct sovereign_session *session,
                          const uint8_t *encrypted,
                          uint16_t encrypted_len,
                          uint8_t *plaintext,
                          uint16_t plaintext_max);

/**
 * Check if session key rotation is due and perform it.
 *
 * Should be called periodically from the main loop or a work queue.
 * Rotates the AES key every SOVEREIGN_KEY_ROTATION_S seconds.
 *
 * @param session Active session context.
 * @return 0 if no rotation needed or rotation succeeded,
 *         negative errno on failure.
 */
int sovereign_check_key_rotation(struct sovereign_session *session);

/**
 * Get the current session state as a human-readable string.
 *
 * @param state Session state enum value.
 * @return Static string describing the state.
 */
const char *sovereign_session_state_str(enum sovereign_session_state state);

#ifdef __cplusplus
}
#endif

#endif /* SOVEREIGN_ARTERY_BLE_H_ */
