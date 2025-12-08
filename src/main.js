import './style.css'
import { gsap } from 'gsap'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  ACESFilmicToneMapping,
  SRGBColorSpace,
  AmbientLight,
  DirectionalLight,
  FogExp2,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  CylinderGeometry,
  TextureLoader,
  RepeatWrapping,
  Clock,
  Group,
  Vector3,
  Raycaster,
  Vector2,
  PointsMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  SphereGeometry,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const sections = [
  {
    id: 'summary',
    title: 'Giới thiệu',
    headline: 'Nguyễn Đăng Khoa — Software Engineer',
    points: [
      '2 năm phát triển web/front-end, nền tảng toán & tư duy logic',
      'Định hướng full-stack, mở rộng DevOps để tự động hoá triển khai',
      'Phong cách: clean code, kiến trúc rõ ràng, hướng sản phẩm',
    ],
  },
  {
    id: 'skills',
    title: 'Kỹ năng',
    headline: 'Ngôn ngữ & Nền tảng',
    points: [
      'C# / .NET (ASP.NET MVC, .NET Core), Java / Spring Boot',
      'JavaScript, React Native; C/C++, WPF, Windows Forms, Unity',
      'SQL Server, MySQL, PostgreSQL, MongoDB; RESTful APIs',
      'Hiểu OOP, SOLID, design patterns; Azure, Firebase, Git',
    ],
  },
  {
    id: 'experience',
    title: 'Kinh nghiệm',
    headline: 'IVC — Backend Java (5/2024-6/2025)',
    points: [
      'Xây dựng API Spring Boot cho hệ thống quản lý khoá học',
      'Auth, phân quyền, tối ưu query MySQL, unit/integration tests (JUnit)',
      'Tham gia Scrum 20 người, code review & đảm bảo quality gate',
    ],
    sub: 'FPT Software — WPF (9/2023-1/2024): chỉnh logic module ô tô, nâng UI/UX cho khách Nhật',
  },
  {
    id: 'projects',
    title: 'Dự án',
    headline: 'Breakfast Meal System (2024)',
    points: [
      'API 4-layer, Repository + Unit of Work, JWT auth/authorization',
      'Voucher, email confirm, Azure Blob storage; deploy Azure App Service + SQL',
      'Link: https://github.com/dangkhoaaaa/Artwork-Sharing-API',
    ],
    sub: 'Particle Analysis (WPF, gRPC microservices): xử lý ảnh realtime, chart động, async pipeline',
  },
  {
    id: 'awards',
    title: 'Giải thưởng',
    headline: 'Tôn vinh tư duy',
    points: [
      'Top 24 F-Code Rode Battle - Backend (6/2023)',
      'Giải KK Olympic Đại số & Giải tích FPTU (2020, 2021)',
    ],
  },
  {
    id: 'contact',
    title: 'Liên hệ',
    headline: 'Kết nối & hợp tác',
    points: [
      'Email: dangkhoa3348@gmail.com',
      'Github: https://github.com/dangkhoaaaa',
      'ĐT: 0378477023 / 0868959482',
      'TP Thủ Đức, TP.HCM',
    ],
  },
]

const app = document.querySelector('#app')
app.innerHTML = `
  <div id="museum">
    <canvas id="canvas"></canvas>
    <div id="hud">
      <div class="brand">
        <div class="pill">3D CV</div>
        <div class="title">Art Museum of Khoa</div>
        <div class="subtitle">Từ CV giấy sang hành trình thị giác</div>
      </div>
      <div class="controls-row">
        <div class="nav" id="nav"></div>
        <button id="project-detail" class="pill-btn">Xem chi tiết dự án</button>
      </div>
      <div class="legend">
        Click hoặc phím số (1-6) để dịch chuyển tới gian trưng bày • Scroll/drag để khám phá
      </div>
      <div id="modal" class="modal hidden">
        <div class="modal-card">
          <button id="modal-close" class="modal-close">✕</button>
          <div class="modal-pill">Project Dispatch</div>
          <div class="modal-title" id="modal-title">Project name</div>
          <div class="modal-meta" id="modal-tech">Stack</div>
          <div class="modal-text" id="modal-desc">Description</div>
          <div class="modal-meta" id="modal-team">Team</div>
        </div>
      </div>
    </div>
  </div>
`

const canvas = document.querySelector('#canvas')
const nav = document.querySelector('#nav')
const projectBtn = document.querySelector('#project-detail')
const modal = document.querySelector('#modal')
const modalTitle = document.querySelector('#modal-title')
const modalTech = document.querySelector('#modal-tech')
const modalDesc = document.querySelector('#modal-desc')
const modalTeam = document.querySelector('#modal-team')
const modalClose = document.querySelector('#modal-close')

const scene = new Scene()
scene.background = new Color('#0c0f16')
scene.fog = new FogExp2('#0c0f16', 0.032)

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 3.5, 12)

const renderer = new WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = SRGBColorSpace
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 6
controls.maxDistance = 25
controls.minPolarAngle = Math.PI * 0.15
controls.maxPolarAngle = Math.PI * 0.45

const clock = new Clock()
const raycaster = new Raycaster()
const pointer = new Vector2()
let hoveredFrame = null
const loader = new TextureLoader()
let galleryVisible = false
let activePlanet = null
let modalOpen = false
let clickBlockUntil = 0
const centerOrbit = new Vector3(0, 4, 0)
const orbitRadius = 12
const orbitSpeed = 0.12

// Lights
scene.add(new AmbientLight(0xffffff, 0.6))
const dir = new DirectionalLight(0xffffff, 1)
dir.position.set(6, 10, 6)
scene.add(dir)

// Floor with subtle pattern
const floorTex = new TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg')
floorTex.wrapS = floorTex.wrapT = RepeatWrapping
floorTex.repeat.set(6, 6)
floorTex.anisotropy = 4
const floor = new Mesh(
  new PlaneGeometry(60, 60),
  new MeshStandardMaterial({ color: '#0c0f16', map: floorTex, roughness: 0.85, metalness: 0.05, transparent: true, opacity: 0.5 })
)
floor.rotation.x = -Math.PI / 2
floor.position.y = 0
scene.add(floor)

// Floating dust
const particleCount = 600
const positions = []
for (let i = 0; i < particleCount; i++) {
  positions.push((Math.random() - 0.5) * 50, Math.random() * 12 + 1, (Math.random() - 0.5) * 50)
}
const particleGeo = new BufferGeometry()
particleGeo.setAttribute('position', new Float32BufferAttribute(positions, 3))
const particleMat = new PointsMaterial({ color: '#5eead4', size: 0.04, transparent: true, opacity: 0.7 })
const dust = new Points(particleGeo, particleMat)
scene.add(dust)

// Helpers to build panels
const createPanelTexture = (section) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 1024, 1024)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(1, '#111827')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#67e8f9'
  ctx.font = 'bold 52px "Segoe UI", sans-serif'
  ctx.fillText(section.title, 60, 110)

  ctx.fillStyle = '#e0f2fe'
  ctx.font = 'bold 38px "Segoe UI", sans-serif'
  wrapText(ctx, section.headline, 60, 190, 900, 42)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '28px "Segoe UI", sans-serif'
  let y = 280
  section.points.forEach((p) => {
    wrapText(ctx, `• ${p}`, 60, y, 900, 36)
    y += 72
  })

  if (section.sub) {
    ctx.fillStyle = '#93c5fd'
    ctx.font = '24px "Segoe UI", sans-serif'
    wrapText(ctx, section.sub, 60, y + 20, 900, 32)
  }

  return new TextureLoader().load(canvas.toDataURL())
}

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}

// Frames group
const frames = new Group()
const radius = 14
let projectFrameRef = null
sections.forEach((section, idx) => {
  const angle = (idx / sections.length) * Math.PI * 2
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius

  const texture = createPanelTexture(section)
  const panel = new Mesh(
    new PlaneGeometry(6, 6.5),
    new MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.4, emissive: '#0ea5e9', emissiveIntensity: 0.15 })
  )
  panel.position.set(x, 3.25, z)
  panel.lookAt(0, 2.5, 0)
  panel.userData = { id: section.id, target: new Vector3(x * 0.6, 3, z * 0.6) }
  if (section.id === 'projects') projectFrameRef = panel

  const pedestal = new Mesh(
    new CylinderGeometry(1.2, 1.2, 0.6, 24),
    new MeshStandardMaterial({ color: '#0f172a', metalness: 0.2, roughness: 0.7, emissive: '#0ea5e9', emissiveIntensity: 0.3 })
  )
  pedestal.position.set(x, 0.3, z)
  frames.add(pedestal)
  frames.add(panel)
})
scene.add(frames)

// Navigation UI
sections.forEach((section, idx) => {
  const btn = document.createElement('button')
  btn.className = 'nav-item'
  btn.innerHTML = `<span>${idx + 1}</span>${section.title}`
  btn.dataset.id = section.id
  btn.addEventListener('click', () => {
    if (modalOpen) return
    focusSection(section.id)
  })
  nav.appendChild(btn)
})

const setActiveNav = (id) => {
  nav.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.id === id)
  })
  if (projectBtn) {
    const shouldShow = id === 'projects'
    projectBtn.classList.toggle('hidden', !shouldShow)
    if (!shouldShow && galleryVisible) toggleProjectGallery(false)
  }
}

// Project planets cluster
const projectGallery = new Group()
projectGallery.visible = false
scene.add(projectGallery)

const projects = [
  {
    name: 'Breakfast Meal System',
    tech: 'ASP.NET Core API, Azure Blob, SQL, JWT',
    desc: 'Đặt món sáng, voucher, email confirm, deploy Azure',
    team: 'Team size: 4',
    color: '#22d3ee',
  },
  {
    name: 'Particle Analysis',
    tech: 'WPF, gRPC microservices, async pipeline',
    desc: 'Xử lý ảnh realtime, chart động, modular service',
    team: 'Team size: 3',
    color: '#a78bfa',
  },
  {
    name: 'Course Management',
    tech: 'Spring Boot, MySQL, JUnit, RBAC',
    desc: 'API quản lý khoá học, auth/role, tối ưu query',
    team: 'Team size: 6',
    color: '#f472b6',
  },
]

const createPlanetTexture = (p) => {
  const cvs = document.createElement('canvas')
  cvs.width = 1024
  cvs.height = 512
  const ctx = cvs.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 1024, 0)
  grad.addColorStop(0, 'rgba(15,23,42,0.95)')
  grad.addColorStop(1, 'rgba(14,165,233,0.25)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, cvs.width, cvs.height)

  ctx.fillStyle = '#e0f2fe'
  ctx.font = 'bold 62px "Segoe UI", sans-serif'
  ctx.fillText(p.name, 60, 140)

  ctx.fillStyle = '#67e8f9'
  ctx.font = 'bold 42px "Segoe UI", sans-serif'
  ctx.fillText(p.tech, 60, 210)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '32px "Segoe UI", sans-serif'
  wrapText(ctx, p.desc, 60, 280, 900, 40)

  ctx.fillStyle = '#a5f3fc'
  ctx.font = 'bold 34px "Segoe UI", sans-serif'
  ctx.fillText(p.team, 60, 380)

  const tex = loader.load(cvs.toDataURL())
  tex.colorSpace = SRGBColorSpace
  return tex
}

const buildProjectPlanets = () => {
  const origin = centerOrbit.clone()
  projectGallery.userData.origin = origin

  const planetSpacing = 8
  projects.forEach((p, i) => {
    const baseAngle = (i / projects.length) * Math.PI * 2

    const planetGroup = new Group()
    planetGroup.position.copy(origin.clone().add(new Vector3(Math.cos(baseAngle) * orbitRadius, 0, Math.sin(baseAngle) * orbitRadius)))

    const planet = new Mesh(
      new SphereGeometry(2.4, 48, 48),
      new MeshStandardMaterial({
        color: p.color,
        map: createPlanetTexture(p),
        roughness: 0.35,
        metalness: 0.65,
        emissive: p.color,
        emissiveIntensity: 0.35,
      })
    )
    planet.userData = { project: p, kind: 'planet', group: planetGroup }
    planetGroup.add(planet)

    const infoCanvas = document.createElement('canvas')
    infoCanvas.width = 1024
    infoCanvas.height = 1024
    const ictx = infoCanvas.getContext('2d')
    const grad = ictx.createRadialGradient(512, 512, 80, 512, 512, 520)
    grad.addColorStop(0, 'rgba(15,23,42,0.9)')
    grad.addColorStop(1, 'rgba(14,165,233,0.18)')
    ictx.fillStyle = grad
    ictx.fillRect(0, 0, 1024, 1024)

    ictx.fillStyle = '#e0f2fe'
    ictx.font = 'bold 56px "Segoe UI", sans-serif'
    ictx.fillText(p.name, 80, 160)

    ictx.fillStyle = '#67e8f9'
    ictx.font = 'bold 42px "Segoe UI", sans-serif'
    ictx.fillText(p.tech, 80, 240)

    ictx.fillStyle = '#cbd5e1'
    ictx.font = '32px "Segoe UI", sans-serif'
    wrapText(ictx, p.desc, 80, 340, 860, 40)

    ictx.fillStyle = '#a5f3fc'
    ictx.font = 'bold 34px "Segoe UI", sans-serif'
    ictx.fillText(p.team, 80, 460)

    const cardTex = loader.load(infoCanvas.toDataURL())
    cardTex.colorSpace = SRGBColorSpace

    const card = new Mesh(
      new PlaneGeometry(4, 2.6),
      new MeshStandardMaterial({ map: cardTex, transparent: true, opacity: 0.95, emissive: p.color, emissiveIntensity: 0.25 })
    )
    card.position.set(0, 3.4, 0)
    card.lookAt(0, 2.5, 0)
    card.userData = { parentPlanet: planet }
    planetGroup.add(card)

    const ring = new Mesh(
      new CylinderGeometry(3.2, 3.2, 0.02, 64, 1, true),
      new MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.8, transparent: true, opacity: 0.3, side: 2 })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(0, -0.4, 0)
    planetGroup.add(ring)

    const haloGeo = new BufferGeometry()
    const haloPos = []
    for (let j = 0; j < 320; j++) {
      haloPos.push((Math.random() - 0.5) * 6, Math.random() * 3 - 1.5, (Math.random() - 0.5) * 6)
    }
    haloGeo.setAttribute('position', new Float32BufferAttribute(haloPos, 3))
    const haloMat = new PointsMaterial({ color: p.color, size: 0.05, transparent: true, opacity: 0.6 })
    const halo = new Points(haloGeo, haloMat)
    planetGroup.add(halo)

    planetGroup.userData = { planet, baseAngle }
    planetGroup.scale.set(1, 1, 1)
    projectGallery.add(planetGroup)
  })
}
buildProjectPlanets()

// Camera transition
const focusSection = (id) => {
  const frame = frames.children.find((c) => c.userData?.id === id)
  if (!frame) return
  const target = frame.userData.target.clone()
  const look = frame.position.clone()
  gsap.to(camera.position, { duration: 1.4, x: target.x, y: target.y, z: target.z, ease: 'power2.inOut' })
  gsap.to(controls.target, { duration: 1.4, x: look.x, y: look.y, z: look.z, ease: 'power2.inOut' })
  setActiveNav(id)
}

const focusGallery = () => {
  if (!projectGallery.userData.origin) return
  const origin = projectGallery.userData.origin.clone()
  const camTarget = origin.clone().add(new Vector3(0, 1.2, 6))
  const look = origin.clone().setY(origin.y)
  gsap.to(camera.position, { duration: 1.4, x: camTarget.x, y: camTarget.y, z: camTarget.z, ease: 'power2.inOut' })
  gsap.to(controls.target, { duration: 1.4, x: look.x, y: look.y, z: look.z, ease: 'power2.inOut' })
  setActiveNav('projects')
}

const focusPlanet = (planet) => {
  const pos = planet.userData.group.position.clone()
  const camTarget = pos.clone().add(new Vector3(0, 1.4, 6))
  const look = pos.clone()
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  gsap.to(camera.position, { duration: 1.2, x: camTarget.x, y: camTarget.y, z: camTarget.z, ease: 'power2.inOut' })
  gsap.to(controls.target, { duration: 1.2, x: look.x, y: look.y, z: look.z, ease: 'power2.inOut' })
  activePlanet = planet
  setActiveNav('projects')
  showModal(planet.userData.project)
}

const toggleProjectGallery = (forceValue) => {
  galleryVisible = typeof forceValue === 'boolean' ? forceValue : !galleryVisible
  projectGallery.visible = galleryVisible
  projectBtn.textContent = galleryVisible ? 'Ẩn chi tiết dự án' : 'Xem chi tiết dự án'
  if (galleryVisible) {
    projectGallery.children.forEach((child) => {
      gsap.fromTo(child.scale, { x: 0.6, y: 0.6, z: 0.6 }, { duration: 0.8, x: 1, y: 1, z: 1, ease: 'back.out(1.6)', stagger: 0.08 })
      gsap.fromTo(child.position, { y: child.position.y - 0.6 }, { duration: 0.8, y: child.position.y, ease: 'power2.out', stagger: 0.05 })
    })
    focusGallery()
  }
}

const showModal = (project) => {
  modalTitle.textContent = project.name || 'Thông tin'
  modalTech.textContent = project.tech || ''
  modalDesc.textContent = Array.isArray(project.desc) ? project.desc.join('\n') : project.desc || ''
  modalTeam.textContent = project.team || ''
  modal.classList.remove('hidden')
  modalOpen = true
  controls.enabled = false
  gsap.fromTo(
    '.modal-card',
    { y: 30, opacity: 0, scale: 0.96 },
    { duration: 0.35, y: 0, opacity: 1, scale: 1, ease: 'power2.out' }
  )
}

const hideModal = () => {
  modal.classList.add('hidden')
  modalOpen = false
  controls.enabled = true
  clickBlockUntil = performance.now() + 200
}

// Interactions
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener('click', (event) => {
  if (performance.now() < clickBlockUntil) return
  if (modalOpen) return
  if (event.target.closest('#hud')) return

  raycaster.setFromCamera(pointer, camera)

  // Check frame panels
  const panels = frames.children.filter((c) => c.isMesh && c.geometry.type === 'PlaneGeometry')
  const panelHit = raycaster.intersectObjects(panels)
  if (panelHit.length) {
    const sectionId = panelHit[0].object.userData?.id
    const section = sections.find((s) => s.id === sectionId)
    if (section) {
      showModal({
        name: section.title,
        tech: section.headline,
        desc: section.points,
        team: section.sub || '',
      })
      return
    }
  }

  if (!projectGallery.visible) return
  raycaster.setFromCamera(pointer, camera)
  const planets = []
  projectGallery.children.forEach((g) => {
    if (g.userData?.planet) planets.push(g.userData.planet)
  })
  const hit = raycaster.intersectObjects(planets)
  if (hit.length) {
    focusPlanet(hit[0].object)
  }
})

window.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= String(sections.length)) {
    focusSection(sections[Number(e.key) - 1].id)
  }
  if (e.key === 'g') toggleProjectGallery()
  if (e.key === 'Escape') hideModal()
})

projectBtn.addEventListener('click', toggleProjectGallery)
projectBtn.addEventListener('click', (e) => {
  if (modalOpen) {
    e.stopPropagation()
    e.preventDefault()
  }
})
modalClose.addEventListener('click', (e) => {
  e.stopPropagation()
  hideModal()
})
modal.addEventListener('click', (e) => {
  e.stopPropagation()
  if (e.target === modal) hideModal()
})

const animate = () => {
  const elapsed = clock.getElapsedTime()
  dust.rotation.y = elapsed * 0.01
  if (projectGallery.visible) {
    projectGallery.children.forEach((child) => {
      const planet = child.userData?.planet
      if (planet) planet.rotation.y += 0.0025
      if (child.userData?.baseAngle !== undefined && (!activePlanet || activePlanet.userData.group !== child || !modalOpen)) {
        const angle = child.userData.baseAngle + elapsed * orbitSpeed
        child.position.set(
          centerOrbit.x + Math.cos(angle) * orbitRadius,
          centerOrbit.y - 0.5,
          centerOrbit.z + Math.sin(angle) * orbitRadius
        )
      }
    })
  }

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(frames.children.filter((c) => c.isMesh && c.geometry.type === 'PlaneGeometry'))
  if (intersects.length) {
    if (hoveredFrame !== intersects[0].object) {
      if (hoveredFrame) hoveredFrame.material.emissiveIntensity = 0.15
      hoveredFrame = intersects[0].object
      hoveredFrame.material.emissiveIntensity = 0.35
    }
  } else if (hoveredFrame) {
    hoveredFrame.material.emissiveIntensity = 0.15
    hoveredFrame = null
  }

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

focusSection('summary')
animate()
