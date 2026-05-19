// Based on "Heartfelt" by Martijn Steinrucken aka BigWings
// https://www.shadertoy.com/view/ltffzl
//
// RAINDROP EFFECT OVERVIEW
// ========================
// This shader simulates raindrops on a glass window. The effect combines:
// 1. A grid-based system where each cell contains one raindrop
// 2. Multiple layers at different scales for depth
// 3. Static small droplets that appear and fade
// 4. Refraction to distort the background through each drop
// 5. Rim lighting and specular highlights for 3D appearance
//
// The key insight is that raindrops on glass don't fall smoothly - they
// stick due to surface tension, accumulate water, then suddenly slide
// down. This "stop and go" motion is achieved using a sawtooth function.

struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  rainAmount: f32,
  dropTime: f32,  // pre-accumulated on CPU to prevent jumps when speed changes
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
  wiperEnabled: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var bgSampler: sampler;
@group(0) @binding(2) var bgTexture: texture_2d<f32>;
@group(0) @binding(3) var wipeMask: texture_2d<f32>;

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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Shorthand for smoothstep - used extensively for soft thresholds
fn S(a: f32, b: f32, t: f32) -> f32 {
  return smoothstep(a, b, t);
}

// Hash function: converts a single float into 3 pseudo-random values (0-1)
// Used to give each grid cell unique random properties (position, size, timing)
fn N13(p: f32) -> vec3<f32> {
  var p3 = fract(vec3<f32>(p) * vec3<f32>(0.1031, 0.11369, 0.13787));
  p3 = p3 + dot(p3, p3.yzx + 19.19);
  return fract(vec3<f32>((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

// Simple 1D hash function
fn N(t: f32) -> f32 {
  return fract(sin(t * 12345.564) * 7658.76);
}

// Sawtooth function: creates the "stick then slide" motion of raindrops
// Returns 0 at t=0, rises to 1 at t=b, then falls back to 0 at t=1
// The steep rise followed by gradual fall mimics how drops suddenly release
// and slide down the glass before slowing and sticking again
fn Saw(b: f32, t: f32) -> f32 {
  return S(0.0, b, t) * S(1.0, b, t);
}

// =============================================================================
// RAINDROP LAYERS
// =============================================================================

// DropLayer2: Creates a layer of falling raindrops
// Returns vec2(dropMask, trailMask) where:
//   - dropMask: intensity of the main drop (used for refraction)
//   - trailMask: intensity of the trail behind the drop (used for blur)
fn DropLayer2(uv: vec2<f32>, t: f32) -> vec2<f32> {
  let UV = uv;

  // Scroll the UV coordinates downward over time to simulate falling rain
  // t is pre-accumulated dropTime, already includes speed
  var uvMod = uv;
  uvMod.y = uvMod.y + t;

  // Create a grid of cells - each cell will contain one raindrop
  // The grid is 12x2 (wider than tall) because drops are vertically elongated
  let a = vec2<f32>(6.0, 1.0);
  let grid = a * 2.0;

  // Shift each column by a random amount so drops don't align horizontally
  var id = floor(uvMod * grid);
  let colShift = N(id.x);
  uvMod.y = uvMod.y + colShift;

  // Get the cell ID and generate random values for this cell
  id = floor(uvMod * grid);
  let n = N13(id.x * 35.2 + id.y * 2376.1);

  // st is the position within the current cell, centered at (0, 0)
  var st = fract(uvMod * grid) - vec2<f32>(0.5, 0.0);

  // Horizontal position: random offset with a slight wiggle based on Y
  // This makes drops wobble side-to-side as they fall, like real water
  var x = n.x - 0.5;
  var y = UV.y * 20.0;
  let wiggle = sin(y + sin(y));
  x = x + wiggle * (0.5 - abs(x)) * (n.z - 0.5);
  x = x * 0.7;

  // Vertical animation: some drops use sawtooth (stick-slide motion),
  // others fall more linearly at varying speeds
  // Divide by 0.75 to match original animation ratio (internal runs faster than grid scroll)
  let scaledT = t / 0.75;
  let ti = fract(scaledT + n.z);  // Phase offset per drop
  let useSaw = n.y > uniforms.sawProbability;
  let speed = 0.5 + n.x * 1.0;
  if (useSaw) {
    // Sawtooth: drop sticks (slow rise) then suddenly slides (fast fall)
    y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
  } else {
    // Linear fall with random speed variation
    y = fract(ti * speed) * 0.9 + 0.05;
  }

  // Calculate distance from current pixel to drop center
  // Multiply by a.yx to account for the non-square grid cells
  let p = vec2<f32>(x, y);
  let d = length((st - p) * a.yx);

  // Main drop: circular with soft edges
  let mainDrop = S(0.4, 0.0, d);

  // Trail: the wet streak left behind as the drop slides down
  // r decreases as we get closer to the drop (trail fades near the drop)
  let r = sqrt(S(1.0, y, st.y));
  let cd = abs(st.x - x);  // Horizontal distance from drop center
  var trail = S(0.23 * r, 0.15 * r * r, cd);
  let trailFront = S(-0.02, 0.02, st.y - y);  // Only show trail above the drop
  trail = trail * trailFront * r * r;

  // Small droplets in the trail: tiny beads of water left behind
  var y2 = UV.y;
  var trail2 = S(0.2 * r, 0.0, cd);
  var droplets = max(0.0, sin(y2 * (1.0 - y2) * 120.0) - st.y) * trail2 * trailFront * n.z;
  y2 = fract(y2 * 10.0) + (st.y - 0.5);
  let dd = length(st - vec2<f32>(x, y2));
  droplets = S(0.3, 0.0, dd);

  // Combine main drop with trail droplets
  let m = mainDrop + droplets * r * trailFront;

  return vec2<f32>(m, trail);
}

// StaticDrops: Small droplets that stick to the glass and slowly fade
// These represent condensation or mist rather than falling rain
fn StaticDrops(uv: vec2<f32>, t: f32) -> f32 {
  // Finer grid (40x40) for many small droplets
  var uvMod = uv * 40.0;

  let id = floor(uvMod);
  uvMod = fract(uvMod) - 0.5;

  // Random position and timing for each droplet
  let n = N13(id.x * 107.45 + id.y * 3543.654);
  let p = (n.xy - 0.5) * 0.7;
  let d = length(uvMod - p);

  // Droplets fade in and out using sawtooth for organic appearance
  let fade = Saw(0.025, fract(t + n.z));
  let c = S(0.3, 0.0, d) * fract(n.z * 10.0) * fade;

  return c;
}

// Drops: Combines all drop layers with controllable intensity
// l0: static drops intensity
// l1: main falling layer intensity
// l2: secondary falling layer (smaller scale) intensity
fn Drops(uv: vec2<f32>, t: f32, l0: f32, l1: f32, l2: f32) -> vec2<f32> {
  let s = StaticDrops(uv, t) * l0;
  let m1 = DropLayer2(uv, t) * l1;
  // Second layer at 1.85x scale adds depth - drops appear at different distances
  let m2 = DropLayer2(uv * 1.85, t) * l2;

  // Combine all drop masks
  var c = s + m1.x + m2.x;
  c = S(0.3, 1.0, c);  // Threshold to sharpen edges

  // Return combined mask and max trail intensity
  return vec2<f32>(c, max(m1.y * l0, m2.y * l1));
}

// =============================================================================
// BACKGROUND RENDERING
// =============================================================================

// Procedural bokeh background: simulates out-of-focus city lights at night
fn ProceduralBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  let aspect = uniforms.width / uniforms.height;
  var coord = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Dark purple gradient for night sky
  var color = mix(
    vec3<f32>(0.08, 0.06, 0.12),
    vec3<f32>(0.15, 0.12, 0.18),
    uv.y
  );

  // Bokeh circles grow larger with more blur (like real out-of-focus lights)
  let blurFactor = blur / 6.0;
  let bokehSize = 0.08 + blurFactor * 0.12;

  // Scatter 15 bokeh lights across the background
  for (var i = 0; i < 15; i = i + 1) {
    let seed = f32(i) * 127.1 + f32(i) * f32(i) * 3.7 + uniforms.randomSeed;
    let n = N13(seed);

    let pos = vec2<f32>((n.x - 0.5) * aspect * 1.5, (n.y - 0.5) * 1.2);
    let size = bokehSize * (0.5 + n.z * 0.8);

    // Variety of warm and cool light colors
    var lightColor: vec3<f32>;
    if (n.z < 0.3) {
      lightColor = vec3<f32>(1.0, 0.6, 0.2);  // Orange
    } else if (n.z < 0.5) {
      lightColor = vec3<f32>(1.0, 0.9, 0.6);  // Warm white
    } else if (n.z < 0.7) {
      lightColor = vec3<f32>(0.4, 0.6, 1.0);  // Blue
    } else {
      lightColor = vec3<f32>(1.0, 0.3, 0.2);  // Red
    }

    let d = length(coord - pos);
    let intensity = S(size * (1.0 + blurFactor), size * 0.1, d);
    let glow = S(size * 2.0, size * 0.5, d) * 0.3;

    color = color + lightColor * (intensity * 0.8 + glow) * (0.5 + n.z * 0.5);
  }

  // Subtle noise to break up banding
  let noiseScale = blur * 0.01;
  let noise = N13(uv.x * 100.0 + uv.y * 1000.0 + uniforms.time * 0.1);
  color = color + (noise - 0.5) * noiseScale;

  return color;
}

// Texture background: samples an image with mipmap-based blur
// Higher mip levels = smaller resolution = blurrier image
fn TextureBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  let texUV = vec2<f32>(uv.x, 1.0 - uv.y);
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

// =============================================================================
// MAIN FRAGMENT SHADER
// =============================================================================

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  var uv = input.uv;
  uv.y = 1.0 - uv.y;  // Flip Y so rain falls downward

  let resolution = vec2<f32>(uniforms.width, uniforms.height);
  var fragCoord = uv * resolution;
  // Center UV and normalize by height for aspect-correct drops
  var centeredUV = (fragCoord - 0.5 * resolution) / resolution.y;

  let t = uniforms.time * 0.2;
  // dropT uses pre-accumulated time to prevent jumps when speed changes
  let dropT = uniforms.dropTime * 0.2;
  let rainAmount = uniforms.rainAmount;

  // More rain = more blur (simulates foggy/wet conditions)
  let maxBlur = mix(uniforms.minBlur, uniforms.maxBlur, rainAmount);
  let minBlur = uniforms.minBlur;

  // Layer intensities based on rain amount
  // Light rain: mostly static drops
  // Heavy rain: all layers active
  let staticDrops = S(-0.5, 1.0, rainAmount) * 2.0;
  let layer1 = S(0.25, 0.75, rainAmount);
  let layer2 = S(0.0, 0.5, rainAmount);

  // Sample wipe mask to determine clean areas
  var wipeFactor = 0.0;
  if (uniforms.wiperEnabled > 0.5) {
    let wipeUV = vec2<f32>(uv.x, 1.0 - uv.y);
    let wipeSize = vec2<u32>(textureDimensions(wipeMask));
    let wipeCoord = vec2<i32>(i32(wipeUV.x * f32(wipeSize.x)), i32(wipeUV.y * f32(wipeSize.y)));
    wipeFactor = textureLoad(wipeMask, wipeCoord, 0).r;
  }

  // Get drop mask and trail mask, reduced by wipe factor
  let c = Drops(centeredUV, dropT, staticDrops, layer1, layer2);
  let dropMask = c.x * (1.0 - wipeFactor);

  // NORMAL CALCULATION via finite differences
  // Sample drops at slightly offset positions to estimate surface slope
  // This gives us the direction light would refract through the drop
  let e = vec2<f32>(0.002, 0.0);
  let cx = Drops(centeredUV + e, dropT, staticDrops, layer1, layer2).x * (1.0 - wipeFactor);
  let cy = Drops(centeredUV + e.yx, dropT, staticDrops, layer1, layer2).x * (1.0 - wipeFactor);
  let n = vec2<f32>(cx - c.x * (1.0 - wipeFactor), cy - c.x * (1.0 - wipeFactor));  // Surface normal (2D gradient)

  // Focus/blur: drops are sharp, background through trail is blurry
  // Wiped areas have sharper focus (less blur)
  let trailBlur = c.y * (1.0 - wipeFactor);
  let focus = mix(maxBlur - trailBlur, minBlur, S(0.1, 0.2, dropMask));
  let wipedFocus = mix(focus, minBlur * 0.5, wipeFactor);

  // REFRACTION: offset UV by normal to simulate light bending through water
  // This is what makes the background appear distorted through each drop
  let refractedUV = uv + n * uniforms.refractionStrength;
  var col = Background(refractedUV, wipedFocus);

  // RIM LIGHTING: bright edge where drop surface curves away from viewer
  // Creates the 3D "dome" appearance of water drops
  let normalMag = length(n) * 30.0;
  let rimLight = S(0.3, 0.8, normalMag) * dropMask * uniforms.rimLightIntensity;
  col = col + vec3<f32>(rimLight);

  // SPECULAR HIGHLIGHT: bright spot where light reflects directly to viewer
  // Simulates a light source (like a street lamp) reflecting off the drop
  let lightDir = normalize(vec2<f32>(-0.5, -0.8));
  let spec = max(0.0, dot(normalize(n + 0.0001), lightDir));
  let specHighlight = pow(spec, uniforms.specularPower) * dropMask * uniforms.specularIntensity;
  col = col + vec3<f32>(specHighlight);

  // Subtle color shift over time for visual interest
  let colFade = sin(uniforms.time * 0.1) * 0.5 + 0.5;
  col = col * mix(vec3<f32>(1.0), vec3<f32>(0.9, 0.95, 1.05), colFade * 0.2);

  // LIGHTNING: occasional bright flashes
  if (uniforms.lightningEnabled > 0.5) {
    let lt = uniforms.time * 0.5;
    var lightning = sin(lt * sin(lt * 10.0));
    lightning = lightning * pow(max(0.0, sin(lt + sin(lt))), 10.0);
    col = col * (1.0 + lightning * uniforms.lightningIntensity);
  }

  // VIGNETTE: darken edges for cinematic look
  let vignetteUV = uv - 0.5;
  col = col * (1.0 - dot(vignetteUV, vignetteUV) * 0.5);

  // Fade in at start
  let fade = S(0.0, 2.0, uniforms.time);
  col = col * fade;

  return vec4<f32>(col, 1.0);
}
