// tests/shared/foundry-event.schema.test.ts
import { describe, it, expect } from 'vitest';
import { FoundryEventSchema, BridgeCommandSchema } from '../../src/shared/schemas/foundry-bridge.schema.js';

describe('Phase 4 Bridge Schemas', () => {
  describe('Inbound Events (Foundry -> Node B)', () => {
    it('validates a buy_item event', () => {
      const valid = {
        type: 'buy_item',
        payload: { 
          itemId: 'ITEM123', 
          costEb: 100, 
          costEagles: 0.5, 
          vendor: 'Mr. Connors',
          actorId: 'ACTOR456'
        }
      };
      const result = FoundryEventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates an approval_response event', () => {
      const valid = {
        type: 'approval_response',
        payload: { 
          proposalId: 'PROP789', 
          status: 'approved',
          editedData: { foo: 'bar' }
        }
      };
      const result = FoundryEventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('Outbound Commands (Node B -> Foundry)', () => {
    it('validates an update_actor command', () => {
      const valid = {
        type: 'update_actor',
        requestId: 'abcdef123',
        payload: { 
          actorId: 'ACTOR123', 
          updates: { 'system.wealth.eb': 500 } 
        }
      };
      const result = BridgeCommandSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates a queue_approval command', () => {
      const valid = {
        type: 'queue_approval',
        requestId: 'defghi456',
        payload: { 
          proposalId: 'PROP123', 
          type: 'item_addition',
          data: { name: 'Cyberdeck' }
        }
      };
      const result = BridgeCommandSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
