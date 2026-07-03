const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { generateHTML } = require('./generator');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key-12345';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create public/shares directory if not exists
const sharesDir = path.join(__dirname, 'public', 'shares');
if (!fs.existsSync(sharesDir)) {
  fs.mkdirSync(sharesDir, { recursive: true });
}

// ==========================================
// DATABASE CONFIGURATION
// ==========================================
let sequelize;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
  console.log('🔌 Connecting to PostgreSQL database...');
  const dialectOptions = {};
  
  if (dbUrl.includes('amazonaws.com') || process.env.NODE_ENV === 'production') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
  }

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions,
    logging: false
  });
} else {
  console.log('🔌 Connecting to local SQLite database (database.sqlite)...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
}

// ==========================================
// MODELS
// ==========================================
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-zA-Z0-9_]+$/i, // alphanumeric and underscore only
      len: [3, 20]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  }
});

const Application = sequelize.define('Application', {
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applied_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  oa_checked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  oa_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  interview_checked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  interview_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  decision: {
    type: DataTypes.ENUM('Pending', 'Offer', 'Rejected', 'Withdrawn'),
    defaultValue: 'Pending',
    allowNull: false
  },
  decision_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Relationships
User.hasMany(Application, { onDelete: 'CASCADE', foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No credentials supplied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Access denied. User profile not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
};

// ==========================================
// STATIC PORTFOLIO REGENERATION
// ==========================================
async function triggerStaticUpdate(userUuid) {
  try {
    const user = await User.findOne({ where: { uuid: userUuid } });
    if (!user) {
      console.error(`❌ User not found with UUID ${userUuid} for static page regeneration.`);
      return;
    }

    const applications = await Application.findAll({
      where: { userId: user.id },
      order: [['applied_date', 'DESC']]
    });

    const htmlContent = generateHTML(user, applications);
    const filePath = path.join(sharesDir, `${userUuid}.html`);
    
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log(`✨ Regenerated static portfolio for ${user.name} at public/shares/${userUuid}.html`);
  } catch (error) {
    console.error('❌ Failed to regenerate static portfolio page:', error);
  }
}

// ==========================================
// SEED SEED DATA IF DB EMPTY
// ==========================================
async function seedDatabase() {
  const userCount = await User.count();
  if (userCount > 0) {
    const users = await User.findAll();
    for (const u of users) {
      await triggerStaticUpdate(u.uuid);
    }
    return;
  }

  console.log('🌱 Database is empty. Seeding credentials users: jane@example.com, bob@example.com (passwords: password123)...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Jane Doe
  const jane = await User.create({
    name: 'Jane Doe',
    username: 'jane',
    email: 'jane@example.com',
    password: hashedPassword,
    uuid: 'jane-doe-portfolio-uuid-12345' // fixed UUID for ease of default testing
  });

  const today = new Date();
  const getPastDateStr = (daysAgo) => {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const janeApps = [
    {
      company: 'Google',
      title: 'Software Engineer',
      applied_date: getPastDateStr(90),
      oa_checked: true,
      oa_date: getPastDateStr(85),
      interview_checked: true,
      interview_date: getPastDateStr(70),
      decision: 'Offer',
      decision_date: getPastDateStr(60),
      notes: 'Received a competitive compensation package. Recruiter was highly responsive!'
    },
    {
      company: 'Meta',
      title: 'Production Engineer',
      applied_date: getPastDateStr(75),
      oa_checked: true,
      oa_date: getPastDateStr(70),
      interview_checked: true,
      interview_date: getPastDateStr(55),
      decision: 'Rejected',
      decision_date: getPastDateStr(45),
      notes: 'Passed the coding rounds but failed the systems design round. Review networks and load balancers.'
    },
    {
      company: 'Stripe',
      title: 'Fullstack Engineer',
      applied_date: getPastDateStr(60),
      oa_checked: true,
      oa_date: getPastDateStr(55),
      interview_checked: true,
      interview_date: getPastDateStr(40),
      decision: 'Withdrawn',
      decision_date: getPastDateStr(35),
      notes: 'Decided to withdraw after receiving the Google offer. Loved their interview layout.'
    },
    {
      company: 'Netflix',
      title: 'UI Engineer',
      applied_date: getPastDateStr(45),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Referral submitted. Waiting on recruiting team.'
    },
    {
      company: 'Amazon',
      title: 'Software Development Engineer',
      applied_date: getPastDateStr(35),
      oa_checked: true,
      oa_date: getPastDateStr(30),
      interview_checked: false,
      decision: 'Pending',
      notes: 'Completed the OA. Relational and debugging sections felt solid.'
    },
    {
      company: 'Microsoft',
      title: 'Solutions Architect',
      applied_date: getPastDateStr(21),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Applied through university portal.'
    },
    {
      company: 'OpenAI',
      title: 'Research Engineer',
      applied_date: getPastDateStr(14),
      oa_checked: false,
      interview_checked: true,
      interview_date: getPastDateStr(7),
      decision: 'Pending',
      notes: 'Chatted with technical lead. Scheduled for final interview loops next week.'
    },
    {
      company: 'Tesla',
      title: 'Firmware Engineer',
      applied_date: getPastDateStr(14),
      oa_checked: true,
      oa_date: getPastDateStr(10),
      interview_checked: false,
      decision: 'Rejected',
      notes: 'Automated rejection after OA submission.'
    },
    {
      company: 'Airbnb',
      title: 'Backend Engineer',
      applied_date: getPastDateStr(7),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Resume screening in progress.'
    },
    {
      company: 'Uber',
      title: 'Systems Engineer',
      applied_date: getPastDateStr(4),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Recruiter reached out via LinkedIn.'
    },
    {
      company: 'Figma',
      title: 'Product Engineer',
      applied_date: getPastDateStr(2),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Fascinated by their multiplayer collaboration architecture. Hope to get an interview!'
    },
    {
      company: 'Slack',
      title: 'Front End Engineer',
      applied_date: getPastDateStr(0),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending',
      notes: 'Standard application on company website.'
    }
  ];

  for (const app of janeApps) {
    await Application.create({ ...app, userId: jane.id });
  }
  await triggerStaticUpdate(jane.uuid);

  // 2. Create Bob Smith
  const bob = await User.create({
    name: 'Bob Smith',
    username: 'bob',
    email: 'bob@example.com',
    password: hashedPassword,
    uuid: 'bob-smith-portfolio-uuid-67890'
  });

  const bobApps = [
    {
      company: 'Meta',
      title: 'Software Engineer',
      applied_date: getPastDateStr(40),
      oa_checked: true,
      oa_date: getPastDateStr(38),
      interview_checked: true,
      interview_date: getPastDateStr(20),
      decision: 'Offer',
      decision_date: getPastDateStr(10),
      notes: 'Got the offer! Thrilled.'
    },
    {
      company: 'Amazon',
      title: 'Software Engineer',
      applied_date: getPastDateStr(30),
      oa_checked: true,
      oa_date: getPastDateStr(25),
      interview_checked: true,
      interview_date: getPastDateStr(15),
      decision: 'Rejected',
      decision_date: getPastDateStr(8),
      notes: 'Rejected after final round.'
    },
    {
      company: 'Microsoft',
      title: 'Software Engineer',
      applied_date: getPastDateStr(20),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending'
    },
    {
      company: 'Netflix',
      title: 'UI Engineer',
      applied_date: getPastDateStr(18),
      oa_checked: true,
      oa_date: getPastDateStr(12),
      interview_checked: false,
      decision: 'Rejected'
    },
    {
      company: 'Apple',
      title: 'iOS Engineer',
      applied_date: getPastDateStr(10),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending'
    },
    {
      company: 'Uber',
      title: 'Backend Engineer',
      applied_date: getPastDateStr(7),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending'
    },
    {
      company: 'Lyft',
      title: 'Fullstack Engineer',
      applied_date: getPastDateStr(5),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending'
    },
    {
      company: 'Airbnb',
      title: 'Backend Engineer',
      applied_date: getPastDateStr(1),
      oa_checked: false,
      interview_checked: false,
      decision: 'Pending'
    }
  ];

  for (const app of bobApps) {
    await Application.create({ ...app, userId: bob.id });
  }
  await triggerStaticUpdate(bob.uuid);

  console.log('🌱 Seed successful! Seeded Jane Doe ("jane") and Bob Smith ("bob").');
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters, alphanumeric or underscore only' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: trimmedUsername } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      username: trimmedUsername,
      password: hashedPassword
    });

    // Generate initial static file
    await triggerStaticUpdate(newUser.uuid);

    // Create token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        uuid: newUser.uuid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
        uuid: user.uuid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get currently logged-in user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      name: req.user.name,
      email: req.user.email,
      username: req.user.username,
      uuid: req.user.uuid
    }
  });
});

// ==========================================
// PUBLIC USER STATS ENDPOINT FOR COMPARISON
// ==========================================
app.get('/api/users/stats/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      where: { username: username.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await Application.findAll({
      where: { userId: user.id },
      order: [['applied_date', 'DESC']]
    });

    res.json({
      username: user.username,
      name: user.name,
      applications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PROTECTED APPLICATIONS API
// ==========================================

// Get all applications for the authenticated user
app.get('/api/applications', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { userId: req.user.id },
      order: [['applied_date', 'DESC']]
    });
    res.json({ user: req.user, applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new application under authenticated user
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const {
      company,
      title,
      applied_date,
      oa_checked,
      oa_date,
      interview_checked,
      interview_date,
      decision,
      decision_date,
      notes
    } = req.body;

    if (!company || !title || !applied_date) {
      return res.status(400).json({ error: 'Company, job title, and applied date are required' });
    }

    const appRecord = await Application.create({
      company,
      title,
      applied_date,
      oa_checked: !!oa_checked,
      oa_date: oa_checked ? (oa_date || null) : null,
      interview_checked: !!interview_checked,
      interview_date: interview_checked ? (interview_date || null) : null,
      decision: decision || 'Pending',
      decision_date: decision !== 'Pending' ? (decision_date || null) : null,
      notes,
      userId: req.user.id
    });

    // Auto-update the static portfolio page
    await triggerStaticUpdate(req.user.uuid);

    res.status(201).json(appRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an application
app.put('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const appRecord = await Application.findByPk(id);
    if (!appRecord) {
      return res.status(404).json({ error: 'Application record not found' });
    }

    // Verify ownership
    if (appRecord.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    const {
      company,
      title,
      applied_date,
      oa_checked,
      oa_date,
      interview_checked,
      interview_date,
      decision,
      decision_date,
      notes
    } = req.body;

    await appRecord.update({
      company: company || appRecord.company,
      title: title || appRecord.title,
      applied_date: applied_date || appRecord.applied_date,
      oa_checked: oa_checked !== undefined ? !!oa_checked : appRecord.oa_checked,
      oa_date: oa_checked ? (oa_date || appRecord.oa_date) : null,
      interview_checked: interview_checked !== undefined ? !!interview_checked : appRecord.interview_checked,
      interview_date: interview_checked ? (interview_date || appRecord.interview_date) : null,
      decision: decision || appRecord.decision,
      decision_date: decision && decision !== 'Pending' ? (decision_date || appRecord.decision_date) : null,
      notes: notes !== undefined ? notes : appRecord.notes
    });

    // Auto-update the static portfolio
    await triggerStaticUpdate(req.user.uuid);

    res.json(appRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an application
app.delete('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const appRecord = await Application.findByPk(id);
    if (!appRecord) {
      return res.status(404).json({ error: 'Application record not found' });
    }

    // Verify ownership
    if (appRecord.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    await appRecord.destroy();

    // Auto-update the static portfolio
    await triggerStaticUpdate(req.user.uuid);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force manual publication/regeneration endpoint
app.post('/api/users/publish', authMiddleware, async (req, res) => {
  try {
    await triggerStaticUpdate(req.user.uuid);
    res.json({ success: true, url: `/shares/${req.user.uuid}.html` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// START SERVER
// ==========================================
async function start() {
  try {
    // Authenticate and Sync DB
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Seed database if empty
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection or server initialization failed:', error);
    process.exit(1);
  }
}

start();
