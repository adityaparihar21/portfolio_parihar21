# Project Specifications & Clone Guide

This document contains the complete design guidelines, architecture details, and recreation instructions for the **AP Portfolio** website.

---

## 1. Project Goal & Design Plan

The website is a premium, cinematic travel filmmaker and photographer portfolio designed to feel extremely premium, responsive, and alive.

Key design elements include:

- **Atmospheric & Immersive:** Dark, low-contrast background, subtle glows, and continuous background video loops.
- **Tactile 3D Components:** Dynamic WebGL canvas instances (spinning minted coin, circular dome photo gallery) that respond to cursor movement and hover states.
- **Fluid Motion & Transitions:** Smooth spring-damped flight of elements across layout positions (e.g. coin logo flight from center preloader into top-left navbar).
- **Performance Optimization:** Aggressive scroll locking during loading, asset preloading, intersection observers for lazy-loading videos, and automatic tab-activity media pausing to save device resources.

---

## 2. Design System & Style Tokens

### Colors (OKLCH Format)

- **Background (Canvas Base):** `oklch(0.13 0.005 60)` (Atmospheric dark charcoal black)
- **Foreground (Text Primary):** `oklch(0.95 0.012 80)` (Soft warm off-white)
- **Primary Accent (Signature Gold):** `oklch(0.78 0.09 80)` (Elegant champagne gold)
- **Card Background:** `oklch(0.17 0.006 60)` (Subtle elevated dark gray)
- **Borders:** `oklch(1 0 0 / 10%)` (Low-contrast divider lines)
- **Accent Glows:** Radial gradient overlays using `rgba(224, 185, 80, 0.15)` for spotlight overlays.

### Typography

- **Serif Font (Headers & Branding):** `"Playfair Display", "Cormorant Garamond", Georgia, serif` (Elegant, classical contrast)
- **Sans-Serif Font (Body & UI):** `"Inter", system-ui, -apple-system, sans-serif` (Clean, legible, modern)

---

## 3. Component Architecture & Assets

### Interactive Preloader

- **Sequential Stage Initialization:**
  1.  _0.0s - 2.5s:_ Plain black loading state with interactive radial gold spotlight tracking cursor/touch position.
  2.  _2.5s - 4.5s:_ Background video `loadingpagebg.mp4` fades in smoothly over 2.0s with a looping slow breathing scale (`scale: 1.15`).
  3.  _4.5s - 6.0s:_ Sequential descriptor words ("Code.", "Vision.", "Cinematography.") slide up side-by-side. A loading shimmer divider line is rendered.
  4.  _6.0s+:_ The divider transforms into a "10s countdown text" (auto-enters on timeout), and the rounded "Enter Site" button fades in with a sliding background hover effect.
- **Transition Sequence (GSAP Fallback):**
  - Clicking "Enter Site" or countdown timeout triggers a cinematic riser sound effect (`/riser.mp3`).
  - The preloader UI elements fade out, and the background video wrapper `.preloader-bg` scales to `1.1` and fades to opacity `0` over 1.5 seconds.
  - At the exact same moment, `isLoading` is set to `false`, causing the 3D coin to fly seamlessly from the center of the screen to the top-left navbar logo placeholder.
- **Scroll Lock Hook:**
  - Thoroughly locks window scroll while `isLoading` is true by setting `document.body.style.overflow = "hidden"` and listening to the window scroll event. It instantly snaps the scroll coordinate back to `(0, 0)` if any displacement is detected.
  - Prevents all touch gestures (`touchmove`), trackpad/mouse scroll ticks (`wheel`), and scroll hotkeys (`spacebar`, `ArrowUp`, `ArrowDown`, `PageUp`, `PageDown`, `Home`, `End`) using passive-false event listeners to enforce a strict viewport lock.

### 3D Monogram (APCoin)

- **Geometry:**
  - Base: A 3D Cylinder geometry (`args={[2.0, 2.0, 0.35, 128]}`) rotated by `Math.PI / 2` around the X-axis to lay flat or spin edge-on.
  - Rims: Torus geometries on the front and back face outer edges to create raised decorative ridges.
  - Text: Stamped 3D text `"AP"` loaded from `/fonts/gentilis_bold.typeface.json` centered on both front and back faces.
- **Procedural PBR Textures (Aged Gold):**
  - _Normal Map:_ Procedural 512x512 Canvas drawing random micro-scratches and circular mint stamp lines to emulate stamped coinage.
  - _Roughness Map:_ Noise patterns mixed with radial gradient highlights to simulate worn/handled edges.
  - _Ambient Occlusion Map:_ Vignette borders and noise pits to mimic age patina and dirt deposits in letters and rims.
- **Studio Lighting:**
  - A sweep Directional Light moving across the X-axis over the first 2.5s for golden reflection highlights.
  - Shadow-casting key light, cool white fill light, golden rim lights from below, and point accents.
  - Post-processing stack using AgX Tone Mapping, Vignette framing, and SMAA anti-aliasing.
- **Handoff Flight Logic:**
  - _Preloader State:_ Coin is positioned at screen center with `z-[110]`. It ramps up Y-axis auto-rotation over 1.5s.
  - _Navbar State:_ Positioned at top-left navbar logo placeholder. Handled by Framer Motion's `layout` transitions and `THREE.MathUtils.damp` which smoothly interpolates coordinates (camera position to `[0, 0, 4]`, lookAt to `[0, 0, 0]`, coin position to `[0, 0, 0]`, and Y-rotation to standard spin speed). Enables interactive OrbitControls rotation only after settling.

### Hero Section

- **Media Loop:** Autoplays a background video sequence `DARK.mp4` scaled larger than the viewport and panning slightly to prevent black cropping borders.
- **Audio Toggle:** A floating bottom-right round button toggles the video's mute/unmute state.

### Selected Work & Reels Sections

- **Grid Layouts:** Dynamic cards displaying cinematic films.
- **Intersection Observer Loaders:** Videos only download and preload source assets when they enter within `200px` of the viewport, reducing initial load bandwidth to zero.
- **Hover Playback:** Cards play video on hover and pause on mouse leave. They include an independent audio toggle on card corners.

### Dome Gallery Section

- **Circular Cylindrical WebGL Dome:**
  - Images are projected onto 3D planes arranged in a circular orbit layout to form a curved panorama.
  - _Interactive Rotation:_ Mouse click-and-drag inputs adjust rotation angles with inertia damping.
  - _Cursor Parallax:_ Subtle float drift based on cursor offset.
  - _Depth Zoom Focus:_ Mouse hovers trigger individual planes to pop forward along their local Z-axis.

---

## 4. Page Visibility API Optimizer

To prevent resource wastage and background audio bleed, a global event listener is bound to `visibilitychange`:

- When the tab is hidden, all playing `<video>` and `<audio>` tags (including the dynamic riser sound object) are paused, and their state is added to a temporary tracker.
- When the user returns to the tab, the paused media elements are automatically resumed.

---

## 5. Master Prompt to Recreate the Website Clone

Copy and use the following detailed prompt in a clean coding workspace to recreate this website:

```text
Develop a premium, highly immersive travel filmmaker and photographer portfolio web application using React, Vite, Tailwind CSS v4, and Three.js (via React Three Fiber, Drei, and Postprocessing). The website must replicate a dark, cinematic design system using OKLCH color codes.

1. Theme & Design Tokens:
- Base Background: oklch(0.13 0.005 60) (dark charcoal black).
- Foreground: oklch(0.95 0.012 80) (soft warm white).
- Accent Gold: oklch(0.78 0.09 80) (champagne gold).
- Typography: Font Serif using Playfair Display/Cormorant Garamond; Font Sans using Inter.
- Custom scrollbar styled with low-opacity oklch gold thumbs.

2. Strict Preloader & Scroll Lock:
- Design a fullscreen preloader overlay (bg-black, z-100) with a cursor-following radial gold spotlight.
- The preloader must execute a timed layout sequence: (0s-2.5s) plain black; (2.5s-4.5s) autoplaying background video loadingpagebg.mp4 fades in with a slow breathing zoom loop; (4.5s-6s) sequential descriptor words ("Code.", "Vision.", "Cinematography.") slide up; (6.0s+) a 10s auto-enter countdown circular timer bar and a premium rounded "Enter Site" button fade in.
- Prevent scroll interaction strictly during the loading state. Lock document.body.style.overflow to hidden, force window.scrollTo(0,0) immediately and on scroll events, and call e.preventDefault() on 'wheel', 'touchmove', and keyboard scroll events (space, arrows, pgup/down, home/end) using passive:false options.
- Clicking "Enter Site" or countdown timeout plays a cinematic riser sound (/riser.mp3), fades out the preloader elements, and sets isLoading to false.

3. 3D Coin (APCoin) & Navbar Flight:
- Build a WebGL Canvas containing a 3D gold coin. The coin is composed of a cylinder geometry, double-sided torus rims on edges, and 3D stamped text "AP" centered on both faces.
- Generate procedural Canvas textures: Normal map containing micro-scratches and circular mint marks; Roughness map containing noise and worn rim spots; Ambient Occlusion map for crevice shadow patina.
- Set up cinematic studio lighting: a directional sweep light moving across the coin on load, shadow-casting key light, white fill light, point lights, and an Environment presets HDRI. Apply AgX Tone Mapping, Vignette, and SMAA post-processing.
- Set up a flight transition using Framer Motion's layout prop. When isLoading is true, the monogram canvas is centered (z-110). When isLoading becomes false, the container shrinks to fixed top-left (w-12 h-12, z-110) while Three.js camera/coin coords damp smoothly to navbar defaults (camera: [0, 0, 4], lookAt: [0, 0, 0], Y-rotation: slow spin). Enable OrbitControls rotation only after coordinates settle. Fade monogram opacity to 0 between scroll progress 0.8 and 0.95 to avoid clipping, then fade back to 1 during flight.

4. Layout Sections & Lazy Loading Media:
- Header: Transparent backdrop-blur border, layout logo placeholder, and mobile overlay menu.
- Hero: Autoplaying background video loop (DARK.mp4) scaled larger to allow panning without cropping. Include a bottom-right mute/unmute audio toggle.
- Selected Work & Reels: Display cards in cards grids. Replay media on hover, pause on leave. Only download and preload video sources when within 200px of the viewport using Intersection Observers. Include independent mute buttons.
- Dome Gallery Section: 3D Canvas rendering a cylindrical carousel of images mapped on planes. Enable inertia rotation on drag, cursor offset drift parallax, and locally offset planes on Z-axis when hovered.
- Testimonials & Footer: Grid layout with letsconnect background CTA image, backdrop blur, social links, and email.

5. Tab Visibility Activity Handler:
- Implement a global document visibilitychange listener.
- If the browser tab becomes hidden, find all running video and audio elements on the page (including riser.mp3 objects) and pause them, storing their reference.
- Once the tab gains focus, resume playback on all cached media elements.
```
