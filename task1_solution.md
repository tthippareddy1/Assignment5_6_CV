# Task 1: Motion Tracking Derivation

## Part (a): Derivation of Motion Tracking Equation from Fundamental Principles

### Fundamental Principle: Brightness Constancy Assumption

The fundamental principle underlying motion tracking is the **brightness constancy assumption** (also known as the optical flow constraint). This states that the intensity of a pixel remains constant as it moves from one frame to the next:

\[
I(x, y, t) = I(x + \Delta x, y + \Delta y, t + \Delta t)
\]

where:
- \(I(x, y, t)\) is the intensity at position \((x, y)\) at time \(t\)
- \((\Delta x, \Delta y)\) is the displacement of the pixel
- \(\Delta t\) is the time difference between frames

### Derivation

Assuming small displacements and using Taylor series expansion:

\[
I(x + \Delta x, y + \Delta y, t + \Delta t) = I(x, y, t) + \frac{\partial I}{\partial x}\Delta x + \frac{\partial I}{\partial y}\Delta y + \frac{\partial I}{\partial t}\Delta t + \text{higher order terms}
\]

Neglecting higher order terms (for small displacements):

\[
I(x, y, t) + \frac{\partial I}{\partial x}\Delta x + \frac{\partial I}{\partial y}\Delta y + \frac{\partial I}{\partial t}\Delta t = I(x, y, t)
\]

Simplifying:

\[
\frac{\partial I}{\partial x}\Delta x + \frac{\partial I}{\partial y}\Delta y + \frac{\partial I}{\partial t}\Delta t = 0
\]

Dividing by \(\Delta t\):

\[
\frac{\partial I}{\partial x}\frac{\Delta x}{\Delta t} + \frac{\partial I}{\partial y}\frac{\Delta y}{\Delta t} + \frac{\partial I}{\partial t} = 0
\]

Defining the velocity components:
- \(u = \frac{\Delta x}{\Delta t}\) (horizontal velocity)
- \(v = \frac{\Delta y}{\Delta t}\) (vertical velocity)

And using shorthand notation:
- \(I_x = \frac{\partial I}{\partial x}\)
- \(I_y = \frac{\partial I}{\partial y}\)
- \(I_t = \frac{\partial I}{\partial t}\)

We obtain the **motion tracking equation** (optical flow constraint equation):

\[
I_x u + I_y v + I_t = 0
\]

Or in vector form:

\[
\nabla I \cdot \mathbf{v} + I_t = 0
\]

where \(\nabla I = (I_x, I_y)\) is the spatial gradient and \(\mathbf{v} = (u, v)\) is the velocity vector.

### Computing Motion Function Estimates for Consecutive Frames

To compute motion estimates, we need to solve for \(u\) and \(v\) at each pixel. However, this single equation has two unknowns, so we need additional constraints. Common approaches include:

1. **Lucas-Kanade method**: Assumes constant velocity in a local neighborhood
2. **Horn-Schunck method**: Assumes smoothness of the flow field globally
3. **Block matching**: Searches for the best matching block in the next frame

For a local window around pixel \((x, y)\), assuming constant velocity \((u, v)\) in that window, we can set up a system of equations:

\[
\begin{bmatrix}
I_x(x_1, y_1) & I_y(x_1, y_1) \\
I_x(x_2, y_2) & I_y(x_2, y_2) \\
\vdots & \vdots \\
I_x(x_n, y_n) & I_y(x_n, y_n)
\end{bmatrix}
\begin{bmatrix}
u \\
v
\end{bmatrix}
=
\begin{bmatrix}
-I_t(x_1, y_1) \\
-I_t(x_2, y_2) \\
\vdots \\
-I_t(x_n, y_n)
\end{bmatrix}
\]

In matrix form: \(A\mathbf{v} = \mathbf{b}\)

The least squares solution is:

\[
\mathbf{v} = (A^T A)^{-1} A^T \mathbf{b}
\]

Where:
\[
A^T A = \begin{bmatrix}
\sum I_x^2 & \sum I_x I_y \\
\sum I_x I_y & \sum I_y^2
\end{bmatrix}
\]

\[
A^T \mathbf{b} = \begin{bmatrix}
-\sum I_x I_t \\
-\sum I_y I_t
\end{bmatrix}
\]

**Note**: To compute motion estimates for specific consecutive frames, we would need the actual image frames. The computation would involve:
1. Loading two consecutive frames \(I_1\) and \(I_2\)
2. Computing spatial gradients \(I_x\) and \(I_y\) from \(I_1\)
3. Computing temporal gradient \(I_t = I_2 - I_1\)
4. For each pixel (or window), solving the system above to get \((u, v)\)

---

## Part (b): Derivation of Lucas-Kanade Algorithm for Affine Motion

### Affine Motion Model

Given the affine motion model:
- \(u(x, y) = a_1 x + b_1 y + c_1\)
- \(v(x, y) = a_2 x + b_2 y + c_2\)

We have 6 parameters to estimate: \(a_1, b_1, c_1, a_2, b_2, c_2\)

### Derivation

Starting from the optical flow constraint equation:

\[
I_x u(x, y) + I_y v(x, y) + I_t = 0
\]

Substituting the affine motion model:

\[
I_x (a_1 x + b_1 y + c_1) + I_y (a_2 x + b_2 y + c_2) + I_t = 0
\]

Expanding:

\[
I_x a_1 x + I_x b_1 y + I_x c_1 + I_y a_2 x + I_y b_2 y + I_y c_2 + I_t = 0
\]

Rearranging:

\[
I_x a_1 x + I_x b_1 y + I_x c_1 + I_y a_2 x + I_y b_2 y + I_y c_2 = -I_t
\]

Grouping by parameters:

\[
(I_x x) a_1 + (I_x y) b_1 + I_x c_1 + (I_y x) a_2 + (I_y y) b_2 + I_y c_2 = -I_t
\]

### Least Squares Formulation

For a local window \(W\) around a point, we assume all pixels in the window follow the same affine transformation. We set up a system of equations for all pixels \((x_i, y_i)\) in the window:

\[
\begin{bmatrix}
I_x(x_1, y_1) x_1 & I_x(x_1, y_1) y_1 & I_x(x_1, y_1) & I_y(x_1, y_1) x_1 & I_y(x_1, y_1) y_1 & I_y(x_1, y_1) \\
I_x(x_2, y_2) x_2 & I_x(x_2, y_2) y_2 & I_x(x_2, y_2) & I_y(x_2, y_2) x_2 & I_y(x_2, y_2) y_2 & I_y(x_2, y_2) \\
\vdots & \vdots & \vdots & \vdots & \vdots & \vdots \\
I_x(x_n, y_n) x_n & I_x(x_n, y_n) y_n & I_x(x_n, y_n) & I_y(x_n, y_n) x_n & I_y(x_n, y_n) y_n & I_y(x_n, y_n)
\end{bmatrix}
\begin{bmatrix}
a_1 \\
b_1 \\
c_1 \\
a_2 \\
b_2 \\
c_2
\end{bmatrix}
=
\begin{bmatrix}
-I_t(x_1, y_1) \\
-I_t(x_2, y_2) \\
\vdots \\
-I_t(x_n, y_n)
\end{bmatrix}
\]

In matrix form: \(A \mathbf{p} = \mathbf{b}\)

where:
- \(A\) is an \(n \times 6\) matrix (each row corresponds to a pixel in the window)
- \(\mathbf{p} = [a_1, b_1, c_1, a_2, b_2, c_2]^T\) is the parameter vector
- \(\mathbf{b} = [-I_t(x_1, y_1), -I_t(x_2, y_2), \ldots, -I_t(x_n, y_n)]^T\)

### Solution

The least squares solution is:

\[
\mathbf{p} = (A^T A)^{-1} A^T \mathbf{b}
\]

### Explicit Form of \(A^T A\)

\[
A^T A = \sum_{(x,y) \in W}
\begin{bmatrix}
(I_x x)^2 & (I_x x)(I_x y) & (I_x x) I_x & (I_x x)(I_y x) & (I_x x)(I_y y) & (I_x x) I_y \\
(I_x x)(I_x y) & (I_x y)^2 & (I_x y) I_x & (I_x y)(I_y x) & (I_x y)(I_y y) & (I_x y) I_y \\
(I_x x) I_x & (I_x y) I_x & I_x^2 & I_x (I_y x) & I_x (I_y y) & I_x I_y \\
(I_x x)(I_y x) & (I_x y)(I_y x) & I_x (I_y x) & (I_y x)^2 & (I_y x)(I_y y) & (I_y x) I_y \\
(I_x x)(I_y y) & (I_x y)(I_y y) & I_x (I_y y) & (I_y x)(I_y y) & (I_y y)^2 & (I_y y) I_y \\
(I_x x) I_y & (I_x y) I_y & I_x I_y & (I_y x) I_y & (I_y y) I_y & I_y^2
\end{bmatrix}
\]

### Explicit Form of \(A^T \mathbf{b}\)

\[
A^T \mathbf{b} = -\sum_{(x,y) \in W}
\begin{bmatrix}
I_x x \cdot I_t \\
I_x y \cdot I_t \\
I_x \cdot I_t \\
I_y x \cdot I_t \\
I_y y \cdot I_t \\
I_y \cdot I_t
\end{bmatrix}
\]

### Algorithm Summary

1. **Compute gradients**: Calculate \(I_x\), \(I_y\), and \(I_t\) for all pixels
2. **For each window**:
   - Build matrix \(A\) using pixels in the window
   - Compute \(A^T A\) and \(A^T \mathbf{b}\)
   - Solve \(\mathbf{p} = (A^T A)^{-1} A^T \mathbf{b}\)
   - Extract affine parameters: \(a_1, b_1, c_1, a_2, b_2, c_2\)
3. **Compute motion**: Use the affine model to compute \(u(x, y)\) and \(v(x, y)\) for each pixel

### Notes

- The window size should be chosen to balance between having enough constraints (need at least 6 pixels for 6 parameters) and maintaining the assumption of constant affine motion within the window
- The matrix \(A^T A\) must be invertible (i.e., the window must contain sufficient texture variation)
- This method is more general than the standard Lucas-Kanade (which assumes constant velocity) as it allows for rotation, scaling, and shearing in addition to translation

