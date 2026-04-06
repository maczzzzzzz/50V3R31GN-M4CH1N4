#ifndef SOVEREIGN_SDK_H
#define SOVEREIGN_SDK_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint16_t magic;
    uint8_t  version;
    uint8_t  packet_type;
    uint32_t sequence_id;
    uint32_t payload_len;
    uint8_t  checksum;
} SovereignHeader;

typedef struct {
    SovereignHeader header;
    uint8_t         intent_type;
    uint8_t         session_id[16];
    uint8_t         actor_id[16];
    uint8_t         payload[256];
} IntentPacket;

typedef struct {
    SovereignHeader header;
    uint8_t         status;
    uint8_t         session_id[16];
    uint32_t        result_code;
    uint8_t         payload[256];
} ResultPacket;

typedef struct {
    uint8_t  id[16];
    uint8_t  name[16];
    float    x;
    float    y;
    int32_t  hp;
    uint8_t  actor_type;
    uint8_t  _reserved[3];
    uint8_t  faction[16];
} RadarBlipRaw;

typedef struct {
    uint8_t  magic[16];
    uint32_t transaction_counter;
    uint32_t blip_count;
} RadarHeader;

typedef struct {
    uint32_t id;
    uint8_t  origin;
    uint8_t  action_type;
    uint8_t  status;
    uint8_t  reserved;
    uint8_t  payload[256];
} Proposal;

// FFI Functions
bool sovereign_header_is_valid(const SovereignHeader* header);
SovereignHeader sovereign_header_new(uint8_t packet_type, uint32_t sequence_id, uint32_t payload_len);
size_t sovereign_intent_packet_size();
size_t sovereign_result_packet_size();

IntentPacket sovereign_intent_packet_new(
    uint8_t intent_type,
    uint32_t sequence_id,
    const uint8_t* session_id,
    const uint8_t* actor_id,
    const uint8_t* payload
);

ResultPacket sovereign_result_packet_new(
    uint8_t status,
    uint32_t sequence_id,
    const uint8_t* session_id,
    uint32_t result_code,
    const uint8_t* payload
);

#ifdef __cplusplus
}
#endif

#endif // SOVEREIGN_SDK_H
