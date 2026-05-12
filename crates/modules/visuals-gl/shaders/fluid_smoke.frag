/**
 * Fluid Smoke Fragment Shader
 *
 * Implements Navier-Stokes fluid simulation for the Ambient Artery background.
 * Maps density fields to a 4-bit desaturated character palette (#1A282F to #376374).
 *
 * Node telemetry (A-D heartbeat frequency) maps to the "vorticity" uniform.
 */

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_vorticity;     // Controlled by node telemetry (0.0 - 1.0)
uniform float u_density_scale; // Overall smoke density
uniform vec2 u_mouse;          // Mouse interaction

// 4-bit desaturated palette (Washed Protocol aesthetic)
const vec3 COLOR_DARK = vec3(0.102, 0.157, 0.184);    // #1A282F
const vec3 COLOR_MID = vec3(0.153, 0.208, 0.235);     // #27353B
const vec3 COLOR_LIGHT = vec3(0.216, 0.388, 0.455);   // #376374

// Fluid simulation parameters
const float VISCOSITY = 0.0001;
const float DIFFUSION = 0.0001;
const float DT = 0.016; // ~60fps

// Simplex noise for natural turbulence
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Curl noise for vortical motion
vec2 curlNoise(vec2 p) {
    float eps = 0.1;
    float n1 = snoise(vec2(p.x, p.y + eps));
    float n2 = snoise(vec2(p.x, p.y - eps));
    float n3 = snoise(vec2(p.x + eps, p.y));
    float n4 = snoise(vec2(p.x - eps, p.y));

    return vec2((n2 - n1) / (2.0 * eps), (n4 - n3) / (2.0 * eps));
}

// Advect density field with velocity field
vec2 advect(vec2 pos, vec2 velocity, float dt) {
    return pos - velocity * dt;
}

// Diffuse density
float diffuse(float density, float diffusion_rate) {
    return density * (1.0 - diffusion_rate);
}

// Apply vorticity confinement
vec2 applyVorticity(vec2 velocity, float vorticity_strength) {
    float curl = velocity.y - velocity.x;
    vec2 gradient = vec2(
        snoise(velocity + vec2(0.01, 0.0)) - snoise(velocity - vec2(0.01, 0.0)),
        snoise(velocity + vec2(0.0, 0.01)) - snoise(velocity - vec2(0.0, 0.01))
    );

    return velocity + vorticity_strength * vec2(-gradient.y, gradient.x) * curl;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 pos = uv * 2.0 - 1.0;
    pos.x *= u_resolution.x / u_resolution.y;

    // Time-varying vorticity based on node telemetry
    float vorticity = mix(0.1, 0.8, u_vorticity);

    // Generate base velocity field from curl noise
    vec2 velocity = curlNoise(pos * 2.0 + u_time * 0.1) * vorticity;

    // Apply mouse interaction (repulsion)
    vec2 mouse_dist = pos - (u_mouse * 2.0 - 1.0);
    float mouse_influence = exp(-length(mouse_dist) * 2.0);
    velocity += normalize(mouse_dist) * mouse_influence * 0.5;

    // Advect position through velocity field
    vec2 advected_pos = advect(pos, velocity, DT);

    // Generate multiple layers of noise for depth
    float noise1 = snoise(advected_pos * 1.5 + u_time * 0.05);
    float noise2 = snoise(advected_pos * 3.0 + u_time * 0.08);
    float noise3 = snoise(advected_pos * 6.0 + u_time * 0.12);

    // Combine noise layers
    float density = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);

    // Apply vorticity to density for swirling effect
    vec2 vortical_velocity = applyVorticity(velocity, vorticity);
    float vortical_density = snoise(advected_pos * 2.0 + vortical_velocity * 0.5);
    density = mix(density, vortical_density, 0.3);

    // Diffuse density
    density = diffuse(density, DIFFUSION);

    // Scale density with uniform
    density *= u_density_scale;

    // Apply vorticity swirl based on node load
    float swirl = u_vorticity * 0.3;
    density += snoise(advected_pos * 4.0 + vec2(sin(u_time * swirl), cos(u_time * swirl))) * 0.15;

    // Map density to 4-bit palette
    vec3 color;
    if (density < 0.2) {
        color = mix(COLOR_DARK, COLOR_MID, density / 0.2);
    } else if (density < 0.6) {
        color = mix(COLOR_MID, COLOR_LIGHT, (density - 0.2) / 0.4);
    } else {
        color = mix(COLOR_LIGHT, vec3(0.3, 0.5, 0.6), (density - 0.6) / 0.4);
    }

    // Add subtle vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    color *= vignette;

    // Add film grain
    float grain = (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
}
