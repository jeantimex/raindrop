struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var backgroundTex: texture_2d<f32>;
@group(0) @binding(2) var dropTex: texture_2d<f32>;
@group(0) @binding(3) var texSampler: sampler;

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

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let uv = input.uv;

  // Sample drop texture
  let dropData = textureSample(dropTex, texSampler, uv);

  // Extract refraction offset (stored as 0.5 + offset)
  let refractionOffset = (dropData.xy - 0.5) * 2.0;
  let dropMask = dropData.z;
  let highlight = dropData.w;

  // Sample background with refraction offset where there are drops
  let refractedUV = uv + refractionOffset * dropMask;
  let background = textureSample(backgroundTex, texSampler, refractedUV);

  // Sample blurred background for areas outside drops (glass blur)
  let blurredBg = textureSample(backgroundTex, texSampler, uv);

  // Mix based on drop mask
  var color = mix(blurredBg.rgb, background.rgb, dropMask * 0.7);

  // Add specular highlights
  color = color + vec3<f32>(highlight * 0.8);

  // Subtle drop shadow/edge - sample unconditionally for uniform control flow
  let edgeOffset = 1.0 / uniforms.width;
  let dropRight = textureSample(dropTex, texSampler, uv + vec2<f32>(edgeOffset, 0.0)).z;
  let dropDown = textureSample(dropTex, texSampler, uv + vec2<f32>(0.0, edgeOffset)).z;
  let edge = abs(dropMask - dropRight) + abs(dropMask - dropDown);
  color = color + vec3<f32>(edge * 0.1 * step(0.01, dropMask));

  // Add slight blue tint to simulate wet glass
  let wetTint = vec3<f32>(0.9, 0.95, 1.0);
  color = color * wetTint;

  // Gamma correction
  color = pow(color, vec3<f32>(1.0 / 2.2));

  return vec4<f32>(color, 1.0);
}
