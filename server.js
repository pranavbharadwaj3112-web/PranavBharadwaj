const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser and CORS middleware
app.use(cors());
app.use(express.json());

// Serve static assets from 'public' directory & root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// MongoDB Atlas Connection Setup
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Successfully connected to MongoDB Atlas');
      await seedDefaultProjectsIfNeeded();
    })
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('Notice: MONGODB_URI environment variable not provided. Operating in local memory mode.');
}

// --- MONGOOSE SCHEMAS & MODELS ---

// Visitor Analytics Schema & Model
const visitorSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userAgent: { type: String, default: 'Unknown' },
  page: { type: String, default: '/' }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// Project Schema & Model
const projectSchema = new mongoose.Schema({
  id: { type: String, index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  difficulty: { type: String, default: 'Intermediate' },
  summary: { type: String, trim: true },
  description: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },
  components: { type: [String], default: [] },
  stars: { type: Number, default: 0 },
  status: { type: String, default: 'Active Build' },
  icon: { type: String, default: 'fa-microchip' },
  gradient: { type: String, default: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' },
  specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// Default initial sample projects
const defaultSampleProjects = [
  {
    id: 'hexapod-rover',
    title: 'Autonomous Hexapod Rover',
    category: 'Autonomous',
    difficulty: 'Advanced',
    summary: 'Terrain-adaptive 18-DOF hexapod walker powered by ROS 2 and Inverse Kinematics.',
    description: 'A 6-legged autonomous rover featuring 18 high-torque servos driven by a custom power management board and a Raspberry Pi 4 running ROS 2 Humble. Features LiDAR-based obstacle avoidance and real-time gait generation.',
    tags: ['ROS 2', 'Raspberry Pi', 'Inverse Kinematics', '3D Printing', 'LiDAR'],
    components: ['Raspberry Pi 4 (8GB)', '18x MG996R Servos', 'RPLIDAR A1M8', 'Custom 2S LiPo Power Board', 'PCA9685 Servo Driver'],
    stars: 142,
    status: 'Active Development',
    icon: 'fa-robot',
    gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    specs: {
      dof: '18 Degrees of Freedom',
      weight: '2.4 kg',
      runtime: '45 mins (5000mAh)',
      controller: 'Raspberry Pi 4 + PCA9685'
    }
  },
  {
    id: 'facetracking-turret',
    title: 'AI Face-Tracking Turret',
    category: 'Computer Vision',
    difficulty: 'Intermediate',
    summary: 'Pan-tilt precision targeting system with real-time OpenCV object and face detection.',
    description: 'Dual-axis gimbal targeting system using ESP32-CAM and a Python host desktop application. Calculates bounding box centroids in real-time to smooth servo movements with PID trajectory control.',
    tags: ['OpenCV', 'ESP32-CAM', 'Python', 'PID Control', 'Servos'],
    components: ['ESP32-CAM Board', '2x SG90 Micro Servos', 'Pan-Tilt Bracket', 'Custom Laser Diode', 'Python / OpenCV Server'],
    stars: 98,
    status: 'Completed',
    icon: 'fa-crosshair',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    specs: {
      fps: '30 FPS @ 720p',
      latency: '< 45ms',
      range: '180° Pan / 90° Tilt',
      controller: 'ESP32 dual-core'
    }
  },
  {
    id: 'riscv-custom-pcb',
    title: 'Custom RISC-V Microcontroller Board',
    category: 'Embedded',
    difficulty: 'Expert',
    summary: '4-layer custom PCB around an open-source RISC-V core with USB-C and Li-Po charging.',
    description: 'Designed in KiCad 7 with 0603 SMD components, controlled trace impedance, and onboard USB-C programming via CH340E bridge. Includes buck-boost regulation and breadboard-friendly pinout headers.',
    tags: ['KiCad', 'RISC-V', 'PCB Design', 'SMD Assembly', 'C++'],
    components: ['CH32V203 RISC-V MCU', 'TPS63020 Buck-Boost', 'USB Type-C Connector', 'Custom 4-Layer PCB', 'CH340E USB-UART'],
    stars: 215,
    status: 'Completed',
    icon: 'fa-microchip',
    gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    specs: {
      layers: '4-Layer FR4 (ENIG)',
      clock: '144 MHz RISC-V',
      flash: '64 KB Flash / 20 KB SRAM',
      power: 'USB-C / 3.7V LiPo'
    }
  },
  {
    id: 'lora-env-monitor',
    title: 'Solar LoRaWAN Weather Node',
    category: 'IoT',
    difficulty: 'Beginner',
    summary: 'Off-grid ultra-low-power telemetry station measuring AQI, humidity, and UV levels.',
    description: 'Deploys an ATmega328P operating in deep sleep mode (< 15uA) waking every 15 minutes to measure temperature, barometric pressure, UV, and particulate matter. Transmits data via LoRa up to 12 km to a TTN gateway.',
    tags: ['LoRaWAN', 'Arduino', 'Sensors', 'Solar', 'MQTT'],
    components: ['Arduino Pro Mini 3.3V', 'RFM95W LoRa Transceiver', 'BME280 Environmental Sensor', '5V Solar Cell + TP4056', 'PIR & UV Sensors'],
    stars: 64,
    status: 'Operational',
    icon: 'fa-solar-panel',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    specs: {
      range: 'up to 12.5 km LOS',
      sleepCurrent: '12.4 µA',
      battery: '18650 Li-Ion (3000mAh)',
      protocols: 'LoRaWAN 1.0.3'
    }
  },
  {
    id: 'emg-prosthetic-hand',
    title: 'Bionic Hand with Myoelectric Sensing',
    category: 'AI/ML',
    difficulty: 'Advanced',
    summary: '3D printed anatomical prosthetic using EMG muscle signals and neural gesture prediction.',
    description: 'Interprets forearm flex signals using dual muscle bio-sensors processed through a lightweight TinyML model on an ARM Cortex-M4 microcontroller. Triggers distinct anatomical grips (pinch, fist, point) with linear actuators.',
    tags: ['TinyML', 'EMG Bio-Sensing', 'ARM Cortex', 'Mechanics', 'C++'],
    components: ['Cortex-M4 STM32F4', 'MyoWare 2.0 EMG Sensors', '5x Micro Linear Actuators', 'Flexible TPU Joints', 'OLED Status Display'],
    stars: 187,
    status: 'Prototype V2',
    icon: 'fa-hand-back-fist',
    gradient: 'linear-gradient(135deg, #b224ef 0%, #7579ff 100%)',
    specs: {
      grips: '6 Pre-set Gestures',
      response: '< 80ms inference',
      actuation: '5x Servo Tendons',
      sensors: '2x Surface EMG channels'
    }
  },
  {
    id: 'underwater-rov',
    title: 'DeepSea Sub-Aquatic ROV',
    category: 'Autonomous',
    difficulty: 'Expert',
    summary: 'Tethered underwater exploration vehicle with live 4K stream & depth stabilization.',
    description: 'Encased in high-pressure acrylic housing rated for 50 meters depth. Driven by 6 brushless thrusters controlled via vectoring layout for 6-DOF submarine movement. Features leak detection and electronic compass positioning.',
    tags: ['Brushless Motors', 'Hydrodynamics', 'Raspberry Pi', 'ESC', '4K Video'],
    components: ['6x T200 Brushless Thrusters', 'Raspberry Pi 4', 'Pixhawk Flight Controller', 'Custom Acrylic Enclosure', '100m Tether Cable'],
    stars: 173,
    status: 'Active Development',
    icon: 'fa-water',
    gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    specs: {
      depthRating: '50 Meters',
      thrusters: '6x Vectoring T200',
      tether: '100m Neutral Buoyancy',
      camera: 'Low-light 4K Stream'
    }
  }
];

// Fallback in-memory arrays when MongoDB is offline
let inMemoryProjects = [...defaultSampleProjects];
let inMemoryVisitors = [];

// Seed sample projects if MongoDB collection is empty
async function seedDefaultProjectsIfNeeded() {
  try {
    const count = await Project.countDocuments();
    if (count === 0) {
      console.log('Seeding initial sample projects to MongoDB Atlas...');
      await Project.insertMany(defaultSampleProjects);
      console.log('Sample projects successfully seeded.');
    }
  } catch (err) {
    console.error('Error seeding initial projects:', err);
  }
}

// Serve index.html on root route
app.get('/', (req, res) => {
  const publicIndexPath = path.join(__dirname, 'public', 'index.html');
  const rootIndexPath = path.join(__dirname, 'index.html');
  
  const fs = require('fs');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  } else {
    return res.sendFile(rootIndexPath);
  }
});

// --- PROJECTS REST API ENDPOINTS ---

// GET /api/projects - Return list of projects from MongoDB or fallback
app.get('/api/projects', async (req, res) => {
  try {
    const { category, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      let queryFilter = {};

      if (category && category !== 'All') {
        queryFilter.category = new RegExp(`^${category}$`, 'i');
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        queryFilter.$or = [
          { title: searchRegex },
          { summary: searchRegex },
          { description: searchRegex },
          { tags: searchRegex }
        ];
      }

      const dbProjects = await Project.find(queryFilter).sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: dbProjects.length,
        projects: dbProjects
      });
    } else {
      let filtered = [...inMemoryProjects];

      if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      return res.json({
        success: true,
        count: filtered.length,
        projects: filtered
      });
    }
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve projects from database' });
  }
});

// GET /api/projects/:id - Return single project details by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const targetId = req.params.id;

    if (mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
      const query = isObjectId 
        ? { $or: [{ id: targetId }, { _id: targetId }] }
        : { id: targetId };

      const project = await Project.findOne(query);

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      return res.json({ success: true, project });
    } else {
      const project = inMemoryProjects.find(p => p.id === targetId || p._id === targetId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      return res.json({ success: true, project });
    }
  } catch (err) {
    console.error('Error fetching project by ID:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve project details' });
  }
});

// POST /api/projects - Add a new project permanently to MongoDB Atlas
app.post('/api/projects', async (req, res) => {
  try {
    const { title, category, description, summary, difficulty, tags, components, specs, icon, gradient } = req.body;

    // Validation: ensure title, category, and description are provided
    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: "title", "category", and "description" are required fields.'
      });
    }

    const projectData = {
      id: req.body.id || 'proj-' + Date.now(),
      title: title.trim(),
      category: category.trim(),
      difficulty: difficulty || 'Intermediate',
      summary: summary ? summary.trim() : description.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Hardware']),
      components: Array.isArray(components) ? components : (components ? components.split(',').map(c => c.trim()) : ['Custom Component']),
      stars: req.body.stars || 1,
      status: req.body.status || 'Active Build',
      icon: icon || (category === 'Autonomous' ? 'fa-robot' : category === 'Computer Vision' ? 'fa-eye' : 'fa-microchip'),
      gradient: gradient || 'linear-gradient(135deg, #00f2fe 0%, #9d4edd 100%)',
      specs: specs || { submitted: 'Just Now', license: 'CC BY-SA 4.0' }
    };

    if (mongoose.connection.readyState === 1) {
      const newProject = new Project(projectData);
      const savedProject = await newProject.save();

      return res.status(201).json({
        success: true,
        message: 'Project created and saved to MongoDB Atlas',
        project: savedProject
      });
    } else {
      inMemoryProjects.unshift(projectData);

      return res.status(201).json({
        success: true,
        message: 'Project created (local memory mode)',
        project: projectData
      });
    }
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ success: false, message: 'Failed to save project to database' });
  }
});

// POST /api/projects/:id/like - Star/like endpoint
app.post('/api/projects/:id/like', async (req, res) => {
  try {
    const targetId = req.params.id;

    if (mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
      const query = isObjectId 
        ? { $or: [{ id: targetId }, { _id: targetId }] }
        : { id: targetId };

      const project = await Project.findOneAndUpdate(
        query,
        { $inc: { stars: 1 } },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      return res.json({ success: true, stars: project.stars });
    } else {
      const project = inMemoryProjects.find(p => p.id === targetId || p._id === targetId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      project.stars += 1;
      return res.json({ success: true, stars: project.stars });
    }
  } catch (err) {
    console.error('Error updating project stars:', err);
    return res.status(500).json({ success: false, message: 'Failed to update star count' });
  }
});

// --- VISITOR ANALYTICS REST API ENDPOINTS ---

// POST /api/visitors - Log a new visitor hit
app.post('/api/visitors', async (req, res) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const page = (req.body && req.body.page) ? req.body.page : '/';

    if (mongoose.connection.readyState === 1) {
      const visitor = new Visitor({ userAgent, page });
      await visitor.save();
      return res.status(201).json({
        success: true,
        message: 'Visit logged to MongoDB',
        visitor
      });
    } else {
      const visitor = {
        _id: 'local-' + Date.now(),
        timestamp: new Date(),
        userAgent,
        page
      };
      inMemoryVisitors.unshift(visitor);
      return res.status(201).json({
        success: true,
        message: 'Visit logged (local memory)',
        visitor
      });
    }
  } catch (err) {
    console.error('Error logging visitor:', err);
    return res.status(500).json({ success: false, message: 'Failed to log visit' });
  }
});

// GET /api/visitors/stats - Fetch analytics stats & last 10 visits
app.get('/api/visitors/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const totalVisits = await Visitor.countDocuments();
      const last10Visits = await Visitor.find().sort({ timestamp: -1 }).limit(10);
      return res.json({
        success: true,
        totalVisits,
        last10Visits
      });
    } else {
      return res.json({
        success: true,
        totalVisits: inMemoryVisitors.length,
        last10Visits: inMemoryVisitors.slice(0, 10)
      });
    }
  } catch (err) {
    console.error('Error fetching visitor stats:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch visitor stats' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Robotics Showcase API server listening on port ${PORT}`);
});
