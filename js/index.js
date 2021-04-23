import * as THREE from './lib/three.module.js';
import Stats from './lib/Stats.js';
import * as dat from "./lib/dat.gui.module.js";
const shaderInclude = 'shaders/common.frag'; // prepend to shader
const currentShader = 'shaders/raymarch.frag'; // current fragment shader path
const mouse = new THREE.Vector4();

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );


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
    user: {value: 1},
    morphing: {value: 0.0}
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
  let current_user = 1.0;
  let keyboard = new THREE.Vector3();
  keyboard.x = 0.;
  keyboard.y = 0.;
  keyboard.z = 2.;
  document.addEventListener("keydown", (e)=>{
    var keyCode = e.code;
    console.log(keyCode);
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
      case 'Digit1':
        current_user = 1;
        break;
      case 'Digit2':
        current_user = 2;
        break;
      case 'Digit3':
        current_user = 3;
        break;
      case 'Digit4':
        current_user = 4;
        break;
      case 'Digit5':
        current_user = 5;
        break;
      default:
        break;
    }
  });

  const gui = new dat.GUI();
  let settings = {
    morphing:0
  }
  // let users = {
  //   user: ''
  // }
  
  gui.add(settings,'morphing',0,1,0.01);
  // let user_gui = gui.add(users, 'user', ['Michael', 'Mozhdeh', 'Kaushik', 'Siddhant', 'Prashant']).setValue('Prashant');
  // user_gui.onChange(function (value) {
  //     switch(value){
  //       case 'Prashant':
  //         current_user = 1.0;
  //         break;
  //       case 'Michael':
  //         current_user = 2.0;
  //         break;
  //       case 'Mozhdeh':
  //         current_user = 3.0;
  //         break;
  //       case 'Kaushik':
  //         current_user = 4.0;
  //         break;
  //       case 'Siddhant':
  //         current_user = 5.0;
  //         break;
  //       default:
  //         current_user = 1.0;
  //         break;
  //     }
  // });

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
    stats.begin();
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
    if(current_user)
      uniforms.user.value = current_user;
    if(settings.morphing)
      uniforms.morphing.value = settings.morphing;
    
    uniforms.iFrame.value = currentFrame;

    renderer.render(scene, camera);
    currentFrame += 1;

    stats.end();
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
