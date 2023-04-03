import * as THREE from "three";
import { BoxGeometry } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector(".webgl");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  radio: window.innerWidth / window.innerHeight,
};

const texture = new THREE.TextureLoader().load("./assets/chees-bg.jpg");

// Scene
const scene = new THREE.Scene();

class box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = `#00ff00`,
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAccelarion = false,
  }) {
    super(

      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ 
        color,
        map: texture
       })
    );

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.velocity = velocity;

    this.position.set(position.x, position.y, position.z);

    this.top = this.position.y + this.height / 2;
    this.bottom = this.position.y - this.height / 2;
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
    this.zAccelarion = zAccelarion;
  }
  updateSides() {
    this.top = this.position.y + this.height / 2;
    this.bottom = this.position.y - this.height / 2;
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }
  update(ground) {
    this.updateSides();

    if (this.zAccelarion) this.velocity.z += 0.0003;

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.status = handleboxClash({
      box1: this,
      box2: ground,
    });
    this.applyGravity();
  }
  applyGravity() {
    this.velocity.y += -0.01;

    if (this.status) {
      this.velocity.y *= 0.5;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}

const handleboxClash = ({ box1, box2 }) => {
  const xAxis = box1.right >= box2.left && box1.left <= box2.right;
  const yAxis = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zAxis = box1.front >= box2.back && box1.back <= box2.front;
  return xAxis && yAxis && zAxis;
};

// Player Cube 
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
const cube = new box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: {
    x: 0,
    y: -0.01,
    z: 0,
  },
});
cube.castShadow = true;
scene.add(cube);

// Ground 
const ground = new box({
  width: 10,
  height: 0.5,
  depth: 40,
  color: "#ffffff",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});
ground.receiveShadow = true;
scene.add(ground);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.position.set(0, 1, 2);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.2))

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.radio, 0.1, 1000);
camera.position.set(0, 2, 6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;

const movement = {
  forward: false,
  backward: false,
  right: false,
  left: false,
};

window.addEventListener("keydown", (event) => {
    const key = event.code;
    if(key == "KeyD" || key == "ArrowRight") {
        movement.right = true;
    }
    else if(key == "KeyA" || key == "ArrowLeft") {
        movement.left = true;
    }
    else if(key == "Space") {
        cube.velocity.y = 0.2;
    }
});

window.addEventListener("keyup", (event) => {
    const key = event.code;
    if(key == "KeyD" || key == "ArrowRight") {
        movement.right = false;
    }
    else if(key == "KeyA" || key == "ArrowLeft") {
        movement.left = false;
    }
});

// Creating Enemy
const enemies = [];
const creatEnimies = () => {
  const enemy = new box({
    width: 1,
    height: 1,
    depth: 1,
    color: "#ff0000",
    position: {
      x: (Math.random() - 0.5) * 10,
      y: 0,
      z: -20,
    },
    velocity: {
      x: 0,
      y: 0,
      z: 0.2,
    },
    zAccelarion: true,
  });
  enemy.castShadow = true;
  scene.add(enemy);
  enemies.push(enemy);
};

// score Updation
let initialPoint = 0;
const score = setInterval(() => {
    document.querySelector(".score").innerHTML = initialPoint++;
},1000)

let frame = 0;
function animate() {
  const animateId = requestAnimationFrame(animate);

  controls.update(); // Update controls
  renderer.render(scene, camera);

  cube.velocity.z = 0;
  cube.velocity.x = 0;
  // Movement
  if (movement.forward) cube.velocity.z = -0.1;
  else if (movement.backward) cube.velocity.z = 0.1;
  if (movement.right) cube.velocity.x = 0.1;
  else if (movement.left) cube.velocity.x = -0.1;

  cube.update(ground, animateId);

  // adding Enemies
  enemies.forEach((enemy) => {
    enemy.update(ground);
    const status = handleboxClash({
      box1: cube,
      box2: enemy,
    });
    if (status) {
      clearInterval(score);
      cancelAnimationFrame(animateId);
    }
  });

  if (frame % 20 == 0) {
    creatEnimies();
  }
  frame++;
}
animate();
