/// Phase 63 — RDT Oracle: Recurrent-Depth Transformer (OpenMythos Architecture)
///
/// Implements an Adaptive Computation Time (ACT) loop over a shared transformer
/// block. The Node C Strategic Oracle uses this to achieve sub-10ms recursive
/// reasoning on the 6GB CUDA ceiling, prioritising depth over breadth per the
/// zeroclaw AGENTS.md invariants.
///
/// Architecture:
///   - Multi-Latent Attention (MLA) — fuses key/value projections to cut VRAM
///   - ACT Halting Loop — per-token depth gating via a learned halting scalar
///   - Layer-Norm stabilisation between recurrent steps
///
/// CUDA invariant: all tensors are allocated on `Device::Cuda(0)` when the
/// `cuda` feature is enabled. Falls back to CPU transparently.

use candle_core::{DType, Device, Module, Result as CandleResult, Tensor};
use candle_nn::{layer_norm, linear, LayerNorm, Linear, VarBuilder, VarMap};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/// Hyperparameters for the RDT Oracle.
/// All dims are tuned for the Node C 6GB VRAM ceiling.
#[derive(Debug, Clone)]
pub struct RdtConfig {
    /// Token / hidden dimension.
    pub hidden_dim: usize,
    /// Latent dimension for Multi-Latent Attention key/value compression.
    pub latent_dim: usize,
    /// Number of attention heads.
    pub num_heads: usize,
    /// Maximum ACT recursion depth (hard ceiling — never exceeded).
    pub max_depth: usize,
    /// Halting threshold ε: loop terminates when cumulative halt prob ≥ 1 - ε.
    pub halt_eps: f64,
}

impl Default for RdtConfig {
    fn default() -> Self {
        Self {
            hidden_dim: 512,
            latent_dim: 128,
            num_heads: 8,
            max_depth: 16,
            halt_eps: 0.01,
        }
    }
}

// ---------------------------------------------------------------------------
// Multi-Latent Attention (MLA)
// ---------------------------------------------------------------------------

/// MLA compresses the K/V projections through a low-rank latent bottleneck,
/// halving the KV-cache footprint — critical for the 6GB ceiling.
pub struct MultiLatentAttention {
    q_proj: Linear,
    kv_down: Linear,  // hidden → latent
    k_up: Linear,     // latent → head_dim * heads
    v_up: Linear,     // latent → head_dim * heads
    out_proj: Linear,
    num_heads: usize,
    head_dim: usize,
}

impl MultiLatentAttention {
    pub fn new(cfg: &RdtConfig, vb: VarBuilder) -> CandleResult<Self> {
        let head_dim = cfg.hidden_dim / cfg.num_heads;
        Ok(Self {
            q_proj:   linear(cfg.hidden_dim, cfg.hidden_dim, vb.pp("q_proj"))?,
            kv_down:  linear(cfg.hidden_dim, cfg.latent_dim, vb.pp("kv_down"))?,
            k_up:     linear(cfg.latent_dim, cfg.hidden_dim, vb.pp("k_up"))?,
            v_up:     linear(cfg.latent_dim, cfg.hidden_dim, vb.pp("v_up"))?,
            out_proj: linear(cfg.hidden_dim, cfg.hidden_dim, vb.pp("out_proj"))?,
            num_heads: cfg.num_heads,
            head_dim,
        })
    }

    /// Forward pass: (batch, seq, hidden) → (batch, seq, hidden)
    pub fn forward(&self, x: &Tensor) -> CandleResult<Tensor> {
        let (b, s, _h) = x.dims3()?;
        let nh = self.num_heads;
        let hd = self.head_dim;

        // Q projection and split into heads
        let q = self.q_proj.forward(x)?
            .reshape((b, s, nh, hd))?
            .transpose(1, 2)?; // (b, nh, s, hd)

        // Compressed KV via latent bottleneck
        let latent = self.kv_down.forward(x)?; // (b, s, latent_dim)
        let k = self.k_up.forward(&latent)?
            .reshape((b, s, nh, hd))?
            .transpose(1, 2)?; // (b, nh, s, hd)
        let v = self.v_up.forward(&latent)?
            .reshape((b, s, nh, hd))?
            .transpose(1, 2)?; // (b, nh, s, hd)

        // Scaled dot-product attention
        let scale = (hd as f64).sqrt();
        let attn = (q.matmul(&k.transpose(2, 3)?)? / scale)?;
        let attn = candle_nn::ops::softmax(&attn, candle_core::D::Minus1)?;
        let out = attn.matmul(&v)?  // (b, nh, s, hd)
            .transpose(1, 2)?       // (b, s, nh, hd)
            .reshape((b, s, nh * hd))?;

        self.out_proj.forward(&out)
    }
}

// ---------------------------------------------------------------------------
// Recurrent Block (shared weights across ACT steps)
// ---------------------------------------------------------------------------

pub struct RecurrentBlock {
    attn: MultiLatentAttention,
    norm1: LayerNorm,
    norm2: LayerNorm,
    ff1: Linear,
    ff2: Linear,
    halt_proj: Linear, // hidden → 1 (sigmoid → halting prob)
}

impl RecurrentBlock {
    pub fn new(cfg: &RdtConfig, vb: VarBuilder) -> CandleResult<Self> {
        let ff_dim = cfg.hidden_dim * 4;
        Ok(Self {
            attn:      MultiLatentAttention::new(cfg, vb.pp("attn"))?,
            norm1:     layer_norm(cfg.hidden_dim, 1e-5, vb.pp("norm1"))?,
            norm2:     layer_norm(cfg.hidden_dim, 1e-5, vb.pp("norm2"))?,
            ff1:       linear(cfg.hidden_dim, ff_dim, vb.pp("ff1"))?,
            ff2:       linear(ff_dim, cfg.hidden_dim, vb.pp("ff2"))?,
            halt_proj: linear(cfg.hidden_dim, 1, vb.pp("halt_proj"))?,
        })
    }

    /// One recurrent step.
    /// Returns (updated_hidden, halt_logit_per_token).
    pub fn step(&self, h: &Tensor) -> CandleResult<(Tensor, Tensor)> {
        // Attention sublayer with residual
        let h = (self.norm1.forward(h)?.apply(&self.attn)? + h)?;
        // Feed-forward sublayer with residual
        let ff = self.norm2.forward(&h)?
            .apply(&self.ff1)?
            .relu()?
            .apply(&self.ff2)?;
        let h = (ff + &h)?;
        // Per-token halting probability
        let halt = self.halt_proj.forward(&h)?
            .squeeze(candle_core::D::Minus1)?; // (b, s)
        Ok((h, halt))
    }
}

// ---------------------------------------------------------------------------
// ACT Loop
// ---------------------------------------------------------------------------

/// Result produced by one ACT forward pass.
pub struct ActOutput {
    /// Final hidden states after halting. Shape: (batch, seq, hidden).
    pub hidden: Tensor,
    /// Mean recursion depth consumed across the batch×seq tokens.
    pub mean_depth: f64,
    /// Per-token remainder weights (for optional ACT loss).
    pub remainders: Tensor,
}

/// Runs the Adaptive Computation Time loop over `block`.
///
/// For each token independently, accumulates halting probabilities until the
/// cumulative sum ≥ 1 - halt_eps, then freezes that token's state.
pub fn act_loop(
    block: &RecurrentBlock,
    input: &Tensor,
    cfg: &RdtConfig,
) -> CandleResult<ActOutput> {
    let (b, s, h) = input.dims3()?;
    let dev = input.device();

    // State tensors
    let mut hidden      = input.clone();
    let mut halted_h    = Tensor::zeros((b, s, h), DType::F32, dev)?;
    let mut cumulative  = Tensor::zeros((b, s), DType::F32, dev)?;
    let mut remainders  = Tensor::ones((b, s), DType::F32, dev)?;
    let mut depths      = Tensor::zeros((b, s), DType::F32, dev)?;

    for depth in 0..cfg.max_depth {
        let (new_h, halt_logit) = block.step(&hidden)?;

        // Sigmoid → halting probability p ∈ (0,1)
        let p = candle_nn::ops::sigmoid(&halt_logit)?; // (b, s)

        // Tokens whose cumulative prob is still below threshold
        let threshold = 1.0 - cfg.halt_eps;
        let still_running = cumulative.lt(threshold as f32)?; // (b, s) bool

        // Effective p: clamp so cumulative never exceeds 1
        let room = (Tensor::ones_like(&cumulative)? - &cumulative)?;
        let is_last = (depth == cfg.max_depth - 1) as u8;
        // On final step, take all remainder
        let effective_p = if is_last == 1 {
            room.clone()
        } else {
            p.minimum(&room)?
        };

        // Apply gate: only update still-running tokens
        let gate = still_running.to_dtype(DType::F32)?;
        let gate3 = gate.unsqueeze(candle_core::D::Minus1)?
            .broadcast_as((b, s, h))?;

        // Weighted accumulate into halted_h
        let weighted = new_h.broadcast_mul(&effective_p.unsqueeze(candle_core::D::Minus1)?.broadcast_as((b, s, h))?)?;
        halted_h = (halted_h + weighted.mul(&gate3)?)?;

        // Update cumulative and remainder
        cumulative = (cumulative + effective_p.mul(&gate)?)?;
        remainders = (Tensor::ones_like(&cumulative)? - &cumulative)?;

        // Depth counter
        depths = (depths + gate)?;

        hidden = new_h;

        // Early exit if all tokens halted
        let still_any = still_running.sum_all()?.to_scalar::<u8>()?;
        if still_any == 0 { break; }
    }

    let mean_depth = depths.mean_all()?.to_scalar::<f32>()? as f64;

    Ok(ActOutput { hidden: halted_h, mean_depth, remainders })
}

// ---------------------------------------------------------------------------
// RdtOracle — public interface
// ---------------------------------------------------------------------------

/// The top-level RDT Oracle. Owns the shared recurrent block and device.
pub struct RdtOracle {
    block: RecurrentBlock,
    cfg: RdtConfig,
    pub device: Device,
}

impl RdtOracle {
    /// Initialise with random weights on the best available device.
    pub fn new(cfg: RdtConfig) -> CandleResult<Self> {
        let device = Device::cuda_if_available(0)?;
        let varmap = VarMap::new();
        let vb = VarBuilder::from_varmap(&varmap, DType::F32, &device);
        let block = RecurrentBlock::new(&cfg, vb)?;
        Ok(Self { block, cfg, device })
    }

    /// Forward: accepts raw f32 slice, returns hidden states and mean depth.
    ///
    /// Input layout: batch × seq × hidden_dim (row-major).
    pub fn reason(
        &self,
        input: &[f32],
        batch: usize,
        seq: usize,
    ) -> CandleResult<ActOutput> {
        let t = Tensor::from_slice(input, (batch, seq, self.cfg.hidden_dim), &self.device)?;
        act_loop(&self.block, &t, &self.cfg)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn cpu_oracle() -> RdtOracle {
        let mut cfg = RdtConfig::default();
        cfg.hidden_dim = 64;
        cfg.latent_dim = 16;
        cfg.num_heads = 4;
        cfg.max_depth = 4;
        RdtOracle::new(cfg).expect("oracle init")
    }

    #[test]
    fn act_loop_runs_without_panic() {
        let oracle = cpu_oracle();
        let batch = 1;
        let seq = 8;
        let data: Vec<f32> = (0..batch * seq * oracle.cfg.hidden_dim)
            .map(|i| (i as f32) * 0.001)
            .collect();
        let out = oracle.reason(&data, batch, seq).expect("reason");
        assert!(out.mean_depth >= 1.0, "at least one ACT step must execute");
        assert!(out.mean_depth <= oracle.cfg.max_depth as f64);
    }

    #[test]
    fn output_shape_matches_input() {
        let oracle = cpu_oracle();
        let (b, s) = (2, 4);
        let data = vec![0.1f32; b * s * oracle.cfg.hidden_dim];
        let out = oracle.reason(&data, b, s).expect("reason");
        let (ob, os, oh) = out.hidden.dims3().expect("dims");
        assert_eq!((ob, os, oh), (b, s, oracle.cfg.hidden_dim));
    }
}
