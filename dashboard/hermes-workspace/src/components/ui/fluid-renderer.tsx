'use client'

import { useRef, useEffect } from 'react'

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_vorticity;
  uniform float u_density_scale;
  uniform vec2 u_mouse;

  const vec3 COLOR_DARK = vec3(0.102, 0.157, 0.184);    // #1A282F
  const vec3 COLOR_MID = vec3(0.153, 0.208, 0.235);     // #27353B
  const vec3 COLOR_LIGHT = vec3(0.216, 0.388, 0.455);   // #376374

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

  vec2 curlNoise(vec2 p) {
    float eps = 0.1;
    float n1 = snoise(vec2(p.x, p.y + eps));
    float n2 = snoise(vec2(p.x, p.y - eps));
    float n3 = snoise(vec2(p.x + eps, p.y));
    float n4 = snoise(vec2(p.x - eps, p.y));
    return vec2((n2 - n1) / (2.0 * eps), (n4 - n3) / (2.0 * eps));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 pos = uv * 2.0 - 1.0;
    pos.x *= u_resolution.x / u_resolution.y;

    float vorticity = mix(0.1, 0.8, u_vorticity);
    vec2 velocity = curlNoise(pos * 2.0 + u_time * 0.1) * vorticity;
    
    vec2 mouse_dist = pos - (u_mouse * 2.0 - 1.0);
    float mouse_influence = exp(-length(mouse_dist) * 2.0);
    velocity += normalize(mouse_dist) * mouse_influence * 0.5;

    vec2 advected_pos = pos - velocity * 0.016;
    float noise1 = snoise(advected_pos * 1.5 + u_time * 0.05);
    float noise2 = snoise(advected_pos * 3.0 + u_time * 0.08);
    
    float density = (noise1 * 0.6 + noise2 * 0.4) * u_density_scale;
    
    vec3 color;
    if (density < 0.2) {
      color = mix(COLOR_DARK, COLOR_MID, density / 0.2);
    } else if (density < 0.6) {
      color = mix(COLOR_MID, COLOR_LIGHT, (density - 0.2) / 0.4);
    } else {
      color = mix(COLOR_LIGHT, vec3(0.3, 0.5, 0.6), (density - 0.6) / 0.4);
    }

    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export type FluidRendererProps = {
  vorticity?: number
  densityScale?: number
  className?: string
}

export function FluidRenderer({
  vorticity = 0.3,
  densityScale = 1.0,
  className,
}: FluidRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const program = gl.createProgram()
    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!program || !vs || !fs) return

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uVorticity = gl.getUniformLocation(program, 'u_vorticity')
    const uDensityScale = gl.getUniformLocation(program, 'u_density_scale')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    let animationFrame: number
    const start = Date.now()

    const resize = () => {
      const displayWidth = canvas.clientWidth
      const displayHeight = canvas.clientHeight
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth
        canvas.height = displayHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }

    const render = () => {
      resize()
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, (Date.now() - start) / 1000)
      gl.uniform1f(uVorticity, vorticity)
      gl.uniform1f(uDensityScale, densityScale)
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrame = requestAnimationFrame(render)
    }

    render()

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('mousemove', handleMouseMove)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [vorticity, densityScale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.4,
      }}
    />
  )
}
