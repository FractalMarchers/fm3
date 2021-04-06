import * as THREE from './scripts/three.module.js';

/**
 * Render scene
 */
function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 3;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xFFFFFF);
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }
  /**
   * Make a 3D object instance
   * @param {Geometry} geometry - The vertex info
   * @param {Number} color - Color in hexadecimal
   * @param {Number} x - Position
   * @return {THREE.Mesh} - Object instance
   */
  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
  }
  const meshes = [
    makeInstance(new THREE.BoxGeometry(1, 1, 1), 0x44aa88, 0),
    makeInstance(new THREE.TetrahedronGeometry(1), 0x8844aa, -2),
    makeInstance(new THREE.TorusGeometry(1, 0.1, 10, 10), 0xaa8844, 2),
  ];
  /**
   * Update canvas pixel size to match view window size
   * @param {THREE.renderer} renderer - the renderer handle
   * @return {Boolean} - true if a resize took place
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    // const pixelRatio = window.devicePixelRatio; // useful for HD-DPI displays
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  /**
   * The render function.
   * @param {Number} time - Render time
   */
  function render(time) {
    time *= 0.001; // convert time to seconds
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    meshes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
main();
