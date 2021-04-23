import * as THREE from './lib/three.module.js';
const shaderInclude = 'shaders/common.frag'; // prepend to shader
const currentShader = 'shaders/raymarch.frag'; // current fragment shader path
const mouse = new THREE.Vector4();

/**
 * read a file from the server.
 * @param {*} path - path to the file
 */
async function readFile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('HTTP error ' + response.status);
  }
  return await response.text();
}
/**
 * Render scene
 */
async function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClearColor = false;
  const camera = new THREE.OrthographicCamera(
      -1, // left
      1, // right
      1, // top
      -1, // bottom
      -1, // near,
      1, // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);
  const clock = new THREE.Clock();
  let currentFrame = 0;
  const uniforms = {
    iTime: {value: 0.0},
    iTimeDelta: {value: 0.0},
    keyboard: {value: new THREE.Vector2(0,0)},
    iFrame: {value: 0},
    iMouse: {value: new THREE.Vector4()},
    iResolution: {value: new THREE.Vector3()},
  };
  let fragmentIncl;
  if (shaderInclude.length > 0) {
    fragmentIncl = await readFile(shaderInclude);
  } else {
    fragmentIncl = '';
  }
  let fragmentShader = await readFile(currentShader);
  fragmentShader = fragmentIncl + fragmentShader;
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
  });
  scene.add(new THREE.Mesh(plane, material));

  let keyboard = new THREE.Vector3();
  keyboard.x = 0.;
  keyboard.y = 0.;
  keyboard.z = 2.;
  document.addEventListener("keydown", (e)=>{
    var keyCode = e.code;
    
    switch(keyCode){
      case 'KeyW':
        keyboard.z += -0.06;
        break;
      case 'KeyA':
        keyboard.x += -0.06;
        break;
      case 'KeyS':
        keyboard.z += 0.06;
        break;
      case 'KeyD':
        keyboard.x += 0.06;
        break;
      case 'ArrowUp':
        keyboard.y += 0.06;
        break;
      case 'ArrowDown':
        keyboard.y += -0.06;
        break;
      default:
        break;
    }
  });

  /**
   * Update canvas pixel size to match view window size
   * @param {THREE.renderer} renderer - the renderer handle
   * @return {Boolean} - true if a resize took place
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
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
    time *= 0.001; // convert to seconds

    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;
    uniforms.iTimeDelta.value = clock.getDelta();
    if(mouse)
    uniforms.iMouse.value = mouse;
    if(keyboard)
      uniforms.keyboard.value =  keyboard;
    uniforms.iFrame.value = currentFrame;

    renderer.render(scene, camera);
    currentFrame += 1;
    requestAnimationFrame(render);
  }
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mouseup', onMouseUp, false);
  requestAnimationFrame(render);
}
/**
 * capture mouse movement
 * @param {event} event - mouse movement event
 */
function onMouseMove( event ) {
  if (mouse.z === 1) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  }
}
/**
 * capture mouse click down
 * @param {event} event - mouse click down event
 */
function onMouseDown( event ) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse.z = 1;
  mouse.w = 1;
}
/**
 * capture mouse unclick
 * @param {event} event - mouse unclick event
 */
function onMouseUp( event ) {
  mouse.z = 0;
  mouse.w = 0;
}
main();
