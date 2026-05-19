struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(
  @location(0) pos: vec2<f32>,
  @location(1) uv: vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(pos, 0.0, 1.0);
  output.uv = uv;
  return output;
}

// Hash function for randomness
fn hash(p: vec2<f32>) -> f32 {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);
  p3 = p3 + dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash2(p: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(hash(p), hash(p + vec2<f32>(127.1, 311.7)));
}

// Bokeh circle
fn bokeh(uv: vec2<f32>, center: vec2<f32>, radius: f32, color: vec3<f32>, softness: f32) -> vec3<f32> {
  let d = length(uv - center);
  let edge = smoothstep(radius, radius - softness, d);
  let ring = smoothstep(radius - softness * 0.5, radius - softness, d) * 0.3;
  return color * (edge + ring);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let aspect = uniforms.width / uniforms.height;
  var coord = vec2<f32>(uv.x * aspect, uv.y);

  // Dark gradient background
  var color = mix(
    vec3<f32>(0.02, 0.02, 0.05),
    vec3<f32>(0.08, 0.06, 0.1),
    uv.y
  );

  // Add some noise to background
  let noise = hash(uv * 1000.0) * 0.02;
  color = color + vec3<f32>(noise);

  // Generate bokeh lights
  let numLights = 15;
  for (var i = 0; i < numLights; i = i + 1) {
    let seed = vec2<f32>(f32(i) * 123.456, f32(i) * 789.012);
    let pos = hash2(seed);
    let lightPos = vec2<f32>(pos.x * aspect, pos.y);

    // Vary sizes
    let size = 0.05 + hash(seed + 1.0) * 0.15;

    // Vary colors - warm tones (oranges, yellows, some cool blues)
    var lightColor: vec3<f32>;
    let colorSeed = hash(seed + 2.0);
    if (colorSeed < 0.4) {
      // Orange/amber
      lightColor = vec3<f32>(1.0, 0.5 + hash(seed + 3.0) * 0.3, 0.1);
    } else if (colorSeed < 0.7) {
      // Yellow/white
      lightColor = vec3<f32>(1.0, 0.9, 0.6 + hash(seed + 4.0) * 0.3);
    } else if (colorSeed < 0.85) {
      // Cool blue
      lightColor = vec3<f32>(0.4, 0.6, 1.0);
    } else {
      // Red
      lightColor = vec3<f32>(1.0, 0.2, 0.1);
    }

    // Intensity varies
    let intensity = 0.3 + hash(seed + 5.0) * 0.7;

    // Subtle animation
    let animOffset = sin(uniforms.time * 0.5 + f32(i)) * 0.005;
    let animPos = lightPos + vec2<f32>(animOffset, animOffset * 0.5);

    color = color + bokeh(coord, animPos, size, lightColor * intensity, size * 0.8);
  }

  // Add subtle vignette
  let vignette = 1.0 - length(uv - 0.5) * 0.5;
  color = color * vignette;

  // Apply blur effect (simulated by just softening overall)
  color = color * 0.9;

  return vec4<f32>(color, 1.0);
}
