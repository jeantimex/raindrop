# Raindrop

A WebGPU implementation of realistic raindrops on glass, based on the beautiful "Heartfelt" shader by **Martijn Steinrucken (BigWings)**.

**Original Shadertoy:** https://www.shadertoy.com/view/ltffzl

## How It Works

The effect simulates raindrops clinging to and sliding down a glass window. Unlike simple particle systems, this approach captures the unique behavior of water on glass: drops that stick, accumulate, then suddenly slide down due to gravity overcoming surface tension.

### Grid-Based Drop Placement

The screen is divided into a grid of cells, with each cell containing exactly one raindrop. This ensures even distribution while allowing randomization within each cell:

```
┌─────┬─────┬─────┬─────┐
│  o  │   o │  o  │   o │  <- Each cell has one drop
├─────┼─────┼─────┼─────┤     at a random position
│ o   │  o  │   o │ o   │
├─────┼─────┼─────┼─────┤
│   o │ o   │  o  │   o │
└─────┴─────┴─────┴─────┘
```

Column shifts prevent drops from aligning horizontally, breaking up the grid pattern.

### The Sawtooth Function (Stick-Slide Motion)

Real raindrops on glass don't fall smoothly. They stick due to surface tension, accumulate water, then suddenly release and slide. This is achieved with a sawtooth function:

```
Position
   │
 1 │        ╱╲
   │       ╱  ╲
   │      ╱    ╲
   │     ╱      ╲
 0 │────╱        ╲────
   └─────────────────── Time
       stick  slide
```

The `Saw()` function creates this motion: slow rise (sticking) followed by rapid fall (sliding).

### Multi-Layer Depth

Two drop layers at different scales create depth perception:

- **Layer 1:** Primary drops at normal scale
- **Layer 2:** Smaller drops at 1.85x UV scale (appear further from glass)
- **Static drops:** Tiny condensation droplets that fade in/out

### Refraction via Finite Differences

Each drop acts as a tiny lens, bending light passing through it. To calculate how much to distort the background, we need the surface normal (slope) of each drop.

This is computed using **finite differences** - sampling the drop field at slightly offset positions:

```
normal.x = drops(uv + vec2(0.002, 0)) - drops(uv)
normal.y = drops(uv + vec2(0, 0.002)) - drops(uv)
```

The resulting normal vector tells us which direction to offset the background UV, creating the lens effect.

### Mipmap-Based Blur

Background blur uses GPU mipmaps rather than expensive multi-tap filters. When a texture is loaded:

1. Generate a mipmap chain (each level is half the resolution)
2. Sample higher mip levels for more blur

```
Mip 0: 1024x1024 (sharp)
Mip 1:  512x512
Mip 2:  256x256
Mip 3:  128x128  (blurry)
...
```

The shader uses `textureSampleLevel()` to choose the blur amount per-pixel. Drops appear sharp while the background through trails appears soft.

### Lighting Model

Two lighting components create the 3D appearance:

**Rim Light:** Highlights drop edges where the surface curves away from the viewer, creating the dome shape.

```
rimLight = smoothstep(0.3, 0.8, |normal|) * dropMask
```

**Specular Highlight:** A bright spot where light reflects directly toward the viewer, simulating a light source (street lamp, etc).

```
spec = pow(dot(normal, lightDir), specularPower)
```

### Drop Anatomy

Each falling drop consists of:

```
         ┌─ Small droplets (beads left behind)
         │
    ·    │
    ·    │
    :    ├─ Trail (wet streak, affects blur)
    :    │
    ⬤   ├─ Main drop (circular, refracts light)
         │
         └─ Wiggle (slight horizontal movement)
```

The trail masks control background blur - areas with trails appear more out-of-focus.

## Parameters

| Parameter | Description |
|-----------|-------------|
| Rain Amount | Overall intensity, controls layer visibility |
| Drop Speed | How fast drops fall down the glass |
| Stop Probability | Chance of stick-slide vs smooth falling |
| Refraction | How much drops distort the background |
| Rim Light | Edge highlight intensity |
| Specular | Bright spot intensity and sharpness |
| Min/Max Blur | Background blur range |
| Lightning | Optional flash effect |

## Architecture

```
src/
├── main.ts                      # App entry, GUI setup, animation loop
├── raindrop/
│   └── RaindropRenderer.ts      # WebGPU setup, texture loading, uniforms
└── shaders/
    └── raindrop.wgsl            # All drop logic, lighting, compositing
```

The entire effect runs in a single fragment shader on a fullscreen quad. No geometry, no particles - just math.