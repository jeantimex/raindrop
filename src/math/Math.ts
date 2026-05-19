export type Vec3 = [number, number, number]
export type Vec4 = [number, number, number, number]
export type Mat4 = number[]

export const Vec3 = {
  add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
  },

  subtract(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  },

  cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ]
  },

  dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  },

  normalize(v: Vec3): Vec3 {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (len === 0) return [0, 0, 0]
    return [v[0] / len, v[1] / len, v[2] / len]
  },

  scale(v: Vec3, s: number): Vec3 {
    return [v[0] * s, v[1] * s, v[2] * s]
  },

  length(v: Vec3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  },
}

export const Mat4 = {
  identity(): Mat4 {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  },

  multiply(a: Mat4, b: Mat4): Mat4 {
    const result: Mat4 = new Array(16).fill(0)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]
        }
      }
    }
    return result
  },

  translation(v: Vec3): Mat4 {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      v[0], v[1], v[2], 1,
    ]
  },

  scaling(v: Vec3): Mat4 {
    return [
      v[0], 0, 0, 0,
      0, v[1], 0, 0,
      0, 0, v[2], 0,
      0, 0, 0, 1,
    ]
  },

  rotationX(angle: number): Mat4 {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ]
  },

  rotationY(angle: number): Mat4 {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]
  },

  rotationZ(angle: number): Mat4 {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  },

  perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1.0 / Math.tan(fov / 2)
    const rangeInv = 1.0 / (near - far)
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ]
  },

  lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const zAxis = Vec3.normalize(Vec3.subtract(eye, target))
    const xAxis = Vec3.normalize(Vec3.cross(up, zAxis))
    const yAxis = Vec3.cross(zAxis, xAxis)

    return [
      xAxis[0], yAxis[0], zAxis[0], 0,
      xAxis[1], yAxis[1], zAxis[1], 0,
      xAxis[2], yAxis[2], zAxis[2], 0,
      -Vec3.dot(xAxis, eye), -Vec3.dot(yAxis, eye), -Vec3.dot(zAxis, eye), 1,
    ]
  },

  inverse(m: Mat4): Mat4 {
    const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3]
    const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7]
    const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11]
    const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15]

    const tmp0 = m22 * m33 - m32 * m23
    const tmp1 = m21 * m33 - m31 * m23
    const tmp2 = m21 * m32 - m31 * m22
    const tmp3 = m20 * m33 - m30 * m23
    const tmp4 = m20 * m32 - m30 * m22
    const tmp5 = m20 * m31 - m30 * m21

    const t0 = tmp0 * m11 - tmp1 * m12 + tmp2 * m13
    const t1 = -(tmp0 * m10 - tmp3 * m12 + tmp4 * m13)
    const t2 = tmp1 * m10 - tmp3 * m11 + tmp5 * m13
    const t3 = -(tmp2 * m10 - tmp4 * m11 + tmp5 * m12)

    const det = 1.0 / (m00 * t0 + m01 * t1 + m02 * t2 + m03 * t3)

    const result: Mat4 = new Array(16)
    result[0] = t0 * det
    result[1] = -(tmp0 * m01 - tmp1 * m02 + tmp2 * m03) * det
    result[2] = (tmp0 * m01 - tmp1 * m02 + tmp2 * m03) * det
    result[3] = t3 * det
    result[4] = t1 * det
    result[5] = (tmp0 * m00 - tmp3 * m02 + tmp4 * m03) * det
    result[6] = -(tmp1 * m00 - tmp3 * m01 + tmp5 * m03) * det
    result[7] = (tmp2 * m00 - tmp4 * m01 + tmp5 * m02) * det
    result[8] = t2 * det
    result[9] = -(tmp0 * m00 - tmp3 * m01 + tmp4 * m02) * det
    result[10] = (m00 * m11 - m01 * m10) * m33 - (m00 * m13 - m03 * m10) * m31 + (m01 * m13 - m03 * m11) * m30
    result[10] *= det
    result[11] = -((m00 * m11 - m01 * m10) * m32 - (m00 * m12 - m02 * m10) * m31 + (m01 * m12 - m02 * m11) * m30) * det
    result[12] = t3 * det
    result[13] = (tmp2 * m00 - tmp4 * m01 + tmp5 * m02) * det
    result[14] = -((m00 * m11 - m01 * m10) * m23 - (m00 * m13 - m03 * m10) * m21 + (m01 * m13 - m03 * m11) * m20) * det
    result[15] = ((m00 * m11 - m01 * m10) * m22 - (m00 * m12 - m02 * m10) * m21 + (m01 * m12 - m02 * m11) * m20) * det

    return result
  },
}
