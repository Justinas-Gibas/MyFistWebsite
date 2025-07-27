📚 Libraries to Use
Purpose	Library	Notes
LaTeX math rendering	MathJax	Clean inline/block math support
SVG generation	SVG.js or Canvg	Useful for layering vector visuals over canvas
PDF export (optional)	jsPDF or Print to PDF	Only if we want built-in save button
Canvas drawing utils	Vanilla <canvas> or fabric.js	Depends how freefor

📊 List of Figures / Canvas Scripts to Build
Here’s a curated list of key figures that will complement each section of your paper. Each will be a modular <canvas> or SVG script.

ID	Title	Description	Format
Fig1	Vacuum Pressure Gradient Field	Radial 2D visualization of $\rho_{vac}(r)$ and $P_{vac}(r)$ around a mass	canvas
Fig2	1D Plot: $\rho_{vac}(r)$ vs $r$	Line plot showing vacuum energy density drop from $\rho_P$ near mass	canvas or Plotly
Fig3	Push vs. Pull: Conceptual Diagram	Show traditional “pulling” arrow vs. VPGM “pushing” arrows with color-coded pressure bands	canvas + SVG arrows
Fig4	Casimir Analogy Comparison	Split screen: plates + vacuum force vs. mass + vacuum gradient	SVG + LaTeX overlay
Fig5	Gravitational Force from $\nabla P$	Vector field arrows showing net pressure on object due to mass	canvas or vector arrows
Fig6	Mass = Vacuum Deficit (Block diagram)	Equation: $m = \Delta\rho V / c^2$ with interactive sliders for $m$, $V$, $\rho$	JS UI + MathJax
Fig7	Multiple Mass Superposition	Visual: overlapping pressure wells from two masses	canvas or WebGL/Three.js (optional)
Fig8	Time Dilation as Vacuum Compression (Optional)	Conceptual: clock deeper in vacuum deficit ticks slower	SVG frames

🛠 Implementation Plan
Each figure will:

Use modular JS files (e.g., fig1-pressure-gradient.js)

Render into <canvas> or <svg> inside a <figure> tag

Be linkable/exportable via a “Save as SVG/PNG” button

Include optional LaTeX-formatted caption (via MathJax)

