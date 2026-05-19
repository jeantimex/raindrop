// Based on "Heartfelt" by Martijn Steinrucken aka BigWings
// https://www.shadertoy.com/view/ltffzl

struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  rainAmount: f32,
  dropSpeed: f32,
  sawProbability: f32,
  dropSize: f32,
  minBlur: f32,
  maxBlur: f32,
  refractionStrength: f32,
  rimLightIntensity: f32,
  specularIntensity: f32,
  specularPower: f32,
  lightningEnabled: f32,
  lightningIntensity: f32,
  useTextureBackground: f32,
  randomSeed: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var bgSampler: sampler;
@group(0) @binding(2) var bgTexture: texture_2d<f32>;

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

fn S(a: f32, b: f32, t: f32) -> f32 {
  return smoothstep(a, b, t);
}

fn N13(p: f32) -> vec3<f32> {
  var p3 = fract(vec3<f32>(p) * vec3<f32>(0.1031, 0.11369, 0.13787));
  p3 = p3 + dot(p3, p3.yzx + 19.19);
  return fract(vec3<f32>((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

fn N(t: f32) -> f32 {
  return fract(sin(t * 12345.564) * 7658.76);
}

fn Saw(b: f32, t: f32) -> f32 {
  return S(0.0, b, t) * S(1.0, b, t);
}

fn DropLayer2(uv: vec2<f32>, t: f32) -> vec2<f32> {
  let UV = uv;

  var uvMod = uv;
  uvMod.y = uvMod.y + t * uniforms.dropSpeed;

  let a = vec2<f32>(6.0, 1.0);
  let grid = a * 2.0;

  var id = floor(uvMod * grid);
  let colShift = N(id.x);
  uvMod.y = uvMod.y + colShift;

  id = floor(uvMod * grid);
  let n = N13(id.x * 35.2 + id.y * 2376.1);
  var st = fract(uvMod * grid) - vec2<f32>(0.5, 0.0);

  var x = n.x - 0.5;

  var y = UV.y * 20.0;
  let wiggle = sin(y + sin(y));
  x = x + wiggle * (0.5 - abs(x)) * (n.z - 0.5);
  x = x * 0.7;

  // Scale animation time by dropSpeed so internal motion matches grid scroll
  let scaledT = t * uniforms.dropSpeed / 0.75;
  let ti = fract(scaledT + n.z);
  // Mix: some drops use Saw (stop-and-go), others fall linearly with varying speed
  let useSaw = n.y > uniforms.sawProbability;
  let speed = 0.5 + n.x * 1.0;
  if (useSaw) {
    y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
  } else {
    y = fract(ti * speed) * 0.9 + 0.05;
  }

  let p = vec2<f32>(x, y);
  let d = length((st - p) * a.yx);

  let mainDrop = S(0.4, 0.0, d);

  let r = sqrt(S(1.0, y, st.y));
  let cd = abs(st.x - x);
  var trail = S(0.23 * r, 0.15 * r * r, cd);
  let trailFront = S(-0.02, 0.02, st.y - y);
  trail = trail * trailFront * r * r;

  var y2 = UV.y;
  var trail2 = S(0.2 * r, 0.0, cd);
  var droplets = max(0.0, sin(y2 * (1.0 - y2) * 120.0) - st.y) * trail2 * trailFront * n.z;
  y2 = fract(y2 * 10.0) + (st.y - 0.5);
  let dd = length(st - vec2<f32>(x, y2));
  droplets = S(0.3, 0.0, dd);

  let m = mainDrop + droplets * r * trailFront;

  return vec2<f32>(m, trail);
}

fn StaticDrops(uv: vec2<f32>, t: f32) -> f32 {
  var uvMod = uv * 40.0;

  let id = floor(uvMod);
  uvMod = fract(uvMod) - 0.5;

  let n = N13(id.x * 107.45 + id.y * 3543.654);
  let p = (n.xy - 0.5) * 0.7;
  let d = length(uvMod - p);

  let fade = Saw(0.025, fract(t + n.z));
  let c = S(0.3, 0.0, d) * fract(n.z * 10.0) * fade;

  return c;
}

fn Drops(uv: vec2<f32>, t: f32, l0: f32, l1: f32, l2: f32) -> vec2<f32> {
  let s = StaticDrops(uv, t) * l0;
  let m1 = DropLayer2(uv, t) * l1;
  let m2 = DropLayer2(uv * 1.85, t) * l2;

  var c = s + m1.x + m2.x;
  c = S(0.3, 1.0, c);

  return vec2<f32>(c, max(m1.y * l0, m2.y * l1));
}

// Procedural bokeh background
fn ProceduralBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  let aspect = uniforms.width / uniforms.height;
  var coord = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);

  var color = mix(
    vec3<f32>(0.08, 0.06, 0.12),
    vec3<f32>(0.15, 0.12, 0.18),
    uv.y
  );

  let blurFactor = blur / 6.0;
  let bokehSize = 0.08 + blurFactor * 0.12;

  for (var i = 0; i < 15; i = i + 1) {
    // Use randomSeed to vary lights each app load
    let seed = f32(i) * 127.1 + f32(i) * f32(i) * 3.7 + uniforms.randomSeed;
    let n = N13(seed);

    let pos = vec2<f32>((n.x - 0.5) * aspect * 1.5, (n.y - 0.5) * 1.2);
    let size = bokehSize * (0.5 + n.z * 0.8);

    var lightColor: vec3<f32>;
    if (n.z < 0.3) {
      lightColor = vec3<f32>(1.0, 0.6, 0.2);
    } else if (n.z < 0.5) {
      lightColor = vec3<f32>(1.0, 0.9, 0.6);
    } else if (n.z < 0.7) {
      lightColor = vec3<f32>(0.4, 0.6, 1.0);
    } else {
      lightColor = vec3<f32>(1.0, 0.3, 0.2);
    }

    let d = length(coord - pos);
    let intensity = S(size * (1.0 + blurFactor), size * 0.1, d);
    let glow = S(size * 2.0, size * 0.5, d) * 0.3;

    color = color + lightColor * (intensity * 0.8 + glow) * (0.5 + n.z * 0.5);
  }

  let noiseScale = blur * 0.01;
  let noise = N13(uv.x * 100.0 + uv.y * 1000.0 + uniforms.time * 0.1);
  color = color + (noise - 0.5) * noiseScale;

  return color;
}

// Texture background with mipmap-based blur
fn TextureBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  // Flip Y back for correct texture orientation
  let texUV = vec2<f32>(uv.x, 1.0 - uv.y);

  // Use mip level for blur - higher level = more blur
  // Map blur (0-10) to mip level (0-10)
  let mipLevel = blur * 1.2;

  let color = textureSampleLevel(bgTexture, bgSampler, texUV, mipLevel).rgb;

  return color;
}

fn Background(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  if (uniforms.useTextureBackground > 0.5) {
    return TextureBackground(uv, blur);
  } else {
    return ProceduralBackground(uv, blur);
  }
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  var uv = input.uv;
  uv.y = 1.0 - uv.y;

  let resolution = vec2<f32>(uniforms.width, uniforms.height);
  var fragCoord = uv * resolution;
  var centeredUV = (fragCoord - 0.5 * resolution) / resolution.y;

  let t = uniforms.time * 0.2;
  let rainAmount = uniforms.rainAmount;

  let maxBlur = mix(uniforms.minBlur, uniforms.maxBlur, rainAmount);
  let minBlur = uniforms.minBlur;

  let staticDrops = S(-0.5, 1.0, rainAmount) * 2.0;
  let layer1 = S(0.25, 0.75, rainAmount);
  let layer2 = S(0.0, 0.5, rainAmount);

  let c = Drops(centeredUV, t, staticDrops, layer1, layer2);
  let dropMask = c.x;

  // Calculate normals via finite differences
  let e = vec2<f32>(0.002, 0.0);
  let cx = Drops(centeredUV + e, t, staticDrops, layer1, layer2).x;
  let cy = Drops(centeredUV + e.yx, t, staticDrops, layer1, layer2).x;
  let n = vec2<f32>(cx - c.x, cy - c.x);

  let focus = mix(maxBlur - c.y, minBlur, S(0.1, 0.2, dropMask));

  // Refraction
  let refractedUV = uv + n * uniforms.refractionStrength;
  var col = Background(refractedUV, focus);

  // Subtle edge highlight - rim light
  let normalMag = length(n) * 30.0;
  let rimLight = S(0.3, 0.8, normalMag) * dropMask * uniforms.rimLightIntensity;
  col = col + vec3<f32>(rimLight);

  // Specular highlight - bright dot
  let lightDir = normalize(vec2<f32>(-0.5, -0.8));
  let spec = max(0.0, dot(normalize(n + 0.0001), lightDir));
  let specHighlight = pow(spec, uniforms.specularPower) * dropMask * uniforms.specularIntensity;
  col = col + vec3<f32>(specHighlight);

  // Color tint
  let colFade = sin(uniforms.time * 0.1) * 0.5 + 0.5;
  col = col * mix(vec3<f32>(1.0), vec3<f32>(0.9, 0.95, 1.05), colFade * 0.2);

  if (uniforms.lightningEnabled > 0.5) {
    let lt = uniforms.time * 0.5;
    var lightning = sin(lt * sin(lt * 10.0));
    lightning = lightning * pow(max(0.0, sin(lt + sin(lt))), 10.0);
    col = col * (1.0 + lightning * uniforms.lightningIntensity);
  }

  let vignetteUV = uv - 0.5;
  col = col * (1.0 - dot(vignetteUV, vignetteUV) * 0.5);

  let fade = S(0.0, 2.0, uniforms.time);
  col = col * fade;

  return vec4<f32>(col, 1.0);
}
