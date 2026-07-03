// ==========================================
// STATE MANAGEMENT
// ==========================================
let token = localStorage.getItem('token') || null;
let currentUser = null;
let applications = [];
let timelineChart = null;

// Comparison State
let comparedUser = null; // Stores target comparison user data
let compareTimelineChartYou = null;
let compareTimelineChartThem = null;

// ==========================================
// DOM ELEMENTS
// ==========================================
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Auth Form
const formAuth = document.getElementById('form-auth');
const authNameGroup = document.getElementById('auth-name-group');
const authName = document.getElementById('auth-name');
const authUsernameGroup = document.getElementById('auth-username-group');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const authSwitchLink = document.getElementById('auth-switch-link');
const authSwitchText = document.getElementById('auth-switch-text');
const authSubtitle = document.getElementById('auth-subtitle');

// Dashboard Header
const btnCopyLink = document.getElementById('btn-copy-link');
const btnViewPortfolio = document.getElementById('btn-view-portfolio');
const btnLogout = document.getElementById('btn-logout');

// Metrics (Single View)
const metricTotal = document.getElementById('metric-total');
const metricInterview = document.getElementById('metric-interview');

// Views
const singleUserView = document.getElementById('single-user-view');
const comparisonView = document.getElementById('comparison-view');

// Comparison Widget Inputs
const compareUsernameInput = document.getElementById('compare-username-input');
const btnCompareSubmit = document.getElementById('btn-compare-submit');
const btnCompareClear = document.getElementById('btn-compare-clear');

// Comparison Layout Elements
const compareHeaderYou = document.getElementById('compare-header-you');
const compareHeaderThem = document.getElementById('compare-header-them');

const compareMetricsYouTotal = document.getElementById('compare-metrics-you-total');
const compareMetricsYouInterview = document.getElementById('compare-metrics-you-interview');
const compareMetricsThemTotal = document.getElementById('compare-metrics-them-total');
const compareMetricsThemInterview = document.getElementById('compare-metrics-them-interview');

// Dashboard Table & Controls
const tableBody = document.getElementById('applications-table-body');
const tableSearch = document.getElementById('table-search');
const tableFilterStatus = document.getElementById('table-filter-status');
const btnAddApplication = document.getElementById('btn-add-application');
const tableCountLabel = document.getElementById('table-count-label');

// Application Modal
const modalApp = document.getElementById('modal-application');
const formApp = document.getElementById('form-application');
const modalAppTitle = document.getElementById('modal-title');

const formAppId = document.getElementById('form-app-id');
const formCompany = document.getElementById('form-company');
const formTitle = document.getElementById('form-title');
const formAppliedDate = document.getElementById('form-applied-date');
const formPipelineStatus = document.getElementById('form-pipeline-status');
const formDecision = document.getElementById('form-decision');

// ==========================================
// INITIALIZATION
// ==========================================
google.charts.load('current', { 'packages': ['sankey'] });
google.charts.setOnLoadCallback(() => {
  if (applications.length > 0) {
    if (comparisonView.style.display === 'block') {
      renderComparisonGraphics();
    } else {
      renderSankeyChart();
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  setupEventListeners();
});

// ==========================================
// SESSION CHECKER
// ==========================================
async function checkAuthSession() {
  if (!token) {
    showAuthScreen();
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showDashboardScreen();
      fetchApplications();
    } else {
      logout();
    }
  } catch (error) {
    console.error('Session validation error:', error);
    showAuthScreen();
  }
}

function showAuthScreen() {
  authScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
  toggleAuthMode('login');
}

function showDashboardScreen() {
  authScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
  btnViewPortfolio.href = `/shares/${currentUser.uuid}.html`;
  
  clearComparison();
}

function logout() {
  token = null;
  currentUser = null;
  applications = [];
  localStorage.removeItem('token');
  showAuthScreen();
}

// ==========================================
// API MUTATIONS
// ==========================================
async function fetchApplications() {
  try {
    const response = await fetch('/api/applications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    const data = await response.json();
    applications = data.applications || [];
    applications.sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date));
    
    updateDashboard();
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

// ==========================================
// UI DRAWING / UPDATES
// ==========================================
function updateDashboard() {
  filterAndRenderTable();
  
  if (comparisonView.style.display === 'block') {
    renderComparisonGraphics();
  } else {
    calculateSingleMetrics();
    renderTimelineChart();
    if (google.visualization && google.visualization.Sankey) {
      renderSankeyChart();
    }
  }
}

function calculateSingleMetrics() {
  const total = applications.length;
  const interviews = applications.filter(app => app.interview_checked).length;

  metricTotal.textContent = total;
  metricInterview.textContent = `${interviews} (${total ? Math.round(interviews / total * 100) : 0}%)`;
}

function filterAndRenderTable() {
  const query = tableSearch.value.toLowerCase().trim();
  const statusFilter = tableFilterStatus.value;

  const filtered = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(query) || 
                          app.title.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || app.decision === statusFilter;
    return matchesSearch && matchesStatus;
  });

  tableCountLabel.textContent = `${filtered.length} of ${applications.length} entries shown`;
  renderTable(filtered);
}

function renderTable(list) {
  tableBody.innerHTML = '';

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No applications match your search. Click "+ Add Job" to create one.</td></tr>`;
    return;
  }

  list.forEach(app => {
    const tr = document.createElement('tr');

    let pipelineVal = 'Applied';
    if (app.interview_checked) {
      pipelineVal = 'Interview';
    } else if (app.oa_checked) {
      pipelineVal = 'Online Assessment';
    }

    const pipelineSelectHtml = `
      <select class="table-inline-select pipeline-select" data-id="${app.id}">
        <option value="Applied" ${pipelineVal === 'Applied' ? 'selected' : ''}>Applied</option>
        <option value="Online Assessment" ${pipelineVal === 'Online Assessment' ? 'selected' : ''}>Online Assessment</option>
        <option value="Interview" ${pipelineVal === 'Interview' ? 'selected' : ''}>Interview</option>
      </select>
    `;

    const decisionSelectHtml = `
      <select class="table-inline-select decision-select" data-id="${app.id}">
        <option value="Pending" ${app.decision === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Offer" ${app.decision === 'Offer' ? 'selected' : ''}>Offer</option>
        <option value="Rejected" ${app.decision === 'Rejected' ? 'selected' : ''}>Rejected</option>
        <option value="Withdrawn" ${app.decision === 'Withdrawn' ? 'selected' : ''}>Withdrawn</option>
      </select>
    `;

    const appliedDateStr = new Date(app.applied_date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    });

    tr.innerHTML = `
      <td>
        <div class="company-name-text">${escapeHtml(app.company)}</div>
        <div class="position-text">${escapeHtml(app.title)}</div>
      </td>
      <td>${appliedDateStr}</td>
      <td>${pipelineSelectHtml}</td>
      <td>${decisionSelectHtml}</td>
      <td class="actions-col">
        <div class="actions-cell-container">
          <button class="btn btn-secondary btn-icon-only btn-edit" data-id="${app.id}" title="Edit Application Name/Date">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-icon-only btn-delete" data-id="${app.id}" title="Delete Application">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('.pipeline-select').forEach(select => {
    select.addEventListener('change', handleInlinePipelineChange);
  });

  tableBody.querySelectorAll('.decision-select').forEach(select => {
    select.addEventListener('change', handleInlineDecisionChange);
  });

  tableBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openEditModal(id);
    });
  });

  tableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      handleDeleteApp(id);
    });
  });
}

// Inline Pipeline status changer
async function handleInlinePipelineChange(e) {
  const appId = e.target.getAttribute('data-id');
  const value = e.target.value;

  const payload = {
    oa_checked: value === 'Online Assessment' || value === 'Interview',
    interview_checked: value === 'Interview'
  };

  try {
    const response = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchApplications();
    } else {
      alert('Failed to update pipeline status.');
    }
  } catch (error) {
    console.error('Error updating pipeline status:', error);
  }
}

// Inline Decision status changer
async function handleInlineDecisionChange(e) {
  const appId = e.target.getAttribute('data-id');
  const value = e.target.value;

  try {
    const response = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ decision: value })
    });

    if (response.ok) {
      await fetchApplications();
    } else {
      alert('Failed to update decision status.');
    }
  } catch (error) {
    console.error('Error updating decision status:', error);
  }
}

// ==========================================
// HEAD-TO-HEAD COMPARISON CONTROLLERS
// ==========================================
async function handleCompareSearch() {
  const targetUsername = compareUsernameInput.value.trim().toLowerCase();
  
  if (!targetUsername) {
    alert('Please enter a username to compare.');
    return;
  }

  if (currentUser && targetUsername === currentUser.username.toLowerCase()) {
    alert("You cannot compare stats against yourself.");
    return;
  }

  try {
    const response = await fetch(`/api/users/stats/${targetUsername}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        alert(`Candidate user "${targetUsername}" not found.`);
      } else {
        alert('Failed to load user statistics.');
      }
      clearComparison();
      return;
    }

    // Save compared user records
    comparedUser = await response.json();
    
    // Toggle Layouts
    singleUserView.style.display = 'none';
    comparisonView.style.display = 'block';
    btnCompareClear.style.display = 'inline-flex';

    // Draw comparison data
    renderComparisonGraphics();

  } catch (error) {
    console.error('Error fetching stats for comparison:', error);
  }
}

function renderComparisonGraphics() {
  if (!comparedUser) return;

  // 1. Set Headers
  compareHeaderYou.textContent = `${currentUser.name} (@${currentUser.username})`;
  compareHeaderThem.textContent = `${comparedUser.name} (@${comparedUser.username})`;

  // 2. Compute Metrics
  const youTotal = applications.length;
  const youInterviews = applications.filter(app => app.interview_checked).length;
  const youRate = youTotal ? Math.round((youInterviews / youTotal) * 100) : 0;

  const themTotal = comparedUser.applications.length;
  const themInterviews = comparedUser.applications.filter(app => app.interview_checked).length;
  const themRate = themTotal ? Math.round((themInterviews / themTotal) * 100) : 0;

  // 3. Render Metrics Text
  compareMetricsYouTotal.textContent = youTotal;
  compareMetricsThemTotal.textContent = themTotal;
  highlightComparisonWinners(compareMetricsYouTotal, compareMetricsThemTotal, youTotal, themTotal);

  compareMetricsYouInterview.textContent = `${youInterviews} (${youRate}%)`;
  compareMetricsThemInterview.textContent = `${themInterviews} (${themRate}%)`;
  // Highlight based on absolute interviews volume or conversion rate (rate is cleaner)
  highlightComparisonWinners(compareMetricsYouInterview, compareMetricsThemInterview, youRate, themRate);

  // 4. Render Sankey funnels side-by-side
  if (google.visualization && google.visualization.Sankey) {
    drawCompareSankey('compare-sankey-you', applications);
    drawCompareSankey('compare-sankey-them', comparedUser.applications);
  }

  // 5. Render Timeline bar charts side-by-side
  drawCompareTimeline('compare-timeline-you', applications, 'you');
  drawCompareTimeline('compare-timeline-them', comparedUser.applications, 'them');
}

function highlightComparisonWinners(elYou, elThem, valYou, valThem) {
  elYou.style.fontWeight = 'normal';
  elYou.style.color = '';
  elThem.style.fontWeight = 'normal';
  elThem.style.color = '';

  if (valYou > valThem) {
    elYou.style.fontWeight = 'bold';
    elYou.style.color = 'var(--success)';
  } else if (valThem > valYou) {
    elThem.style.fontWeight = 'bold';
    elThem.style.color = 'var(--success)';
  } else {
    elYou.style.fontWeight = 'bold';
    elThem.style.fontWeight = 'bold';
  }
}

function clearComparison() {
  comparedUser = null;
  compareUsernameInput.value = '';

  // Destroy comparison charts
  if (compareTimelineChartYou) {
    compareTimelineChartYou.destroy();
    compareTimelineChartYou = null;
  }
  if (compareTimelineChartThem) {
    compareTimelineChartThem.destroy();
    compareTimelineChartThem = null;
  }

  // Toggle Visibility
  singleUserView.style.display = 'block';
  comparisonView.style.display = 'none';
  btnCompareClear.style.display = 'none';

  // Force redraw single graphics
  calculateSingleMetrics();
  renderTimelineChart();
  if (google.visualization && google.visualization.Sankey) {
    renderSankeyChart();
  }
}

// Side-by-side custom Sankey drawer
function drawCompareSankey(containerId, apps) {
  const container = document.getElementById(containerId);
  const nonPending = apps.filter(app => app.decision !== 'Pending');

  if (nonPending.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">No completed applications to show.</div>';
    return;
  }

  const flows = {};
  const addFlow = (source, target, weight = 1) => {
    const key = `${source} -> ${target}`;
    flows[key] = (flows[key] || 0) + weight;
  };

  nonPending.forEach(app => {
    let current = 'Applied';
    if (app.oa_checked) {
      addFlow('Applied', 'Online Assessment');
      current = 'Online Assessment';
    }
    if (app.interview_checked) {
      addFlow(current, 'Interview');
      current = 'Interview';
    }

    let destination = '';
    if (app.decision === 'Offer') {
      destination = 'Offer';
    } else if (app.decision === 'Rejected') {
      destination = 'Rejected';
    } else if (app.decision === 'Withdrawn') {
      destination = 'Withdrawn';
    }
    addFlow(current, destination);
  });

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('string', 'From');
  dataTable.addColumn('string', 'To');
  dataTable.addColumn('number', 'Weight');

  const rows = [];
  Object.keys(flows).forEach(key => {
    const [from, to] = key.split(' -> ');
    rows.push([from, to, flows[key]]);
  });
  dataTable.addRows(rows);

  const colors = ['#6366f1', '#06b6d4', '#d97706', '#16a34a', '#dc2626', '#64748b', '#a855f7'];
  const options = {
    sankey: {
      node: {
        colors: colors,
        label: { color: '#0f172a', fontFamily: 'Inter', fontSize: 10, bold: true },
        nodePadding: 20,
        width: 8,
        interactivity: true
      },
      link: {
        colorMode: 'source',
        color: { fillOpacity: 0.3 }
      }
    }
  };

  const chart = new google.visualization.Sankey(container);
  chart.draw(dataTable, options);
}

// Side-by-side custom timeline charts
function drawCompareTimeline(canvasId, apps, type) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (apps.length === 0) {
    if (type === 'you' && compareTimelineChartYou) compareTimelineChartYou.destroy();
    if (type === 'them' && compareTimelineChartThem) compareTimelineChartThem.destroy();
    canvas.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.8rem;">No timeline data.</div>';
    return;
  }

  // Safe recreate canvas if container got wiped previously
  if (!document.getElementById(canvasId)) {
    canvas.parentNode.innerHTML = `<canvas id="${canvasId}"></canvas>`;
    return drawCompareTimeline(canvasId, apps, type);
  }

  const dailyCounts = {};
  const chronological = [...apps].sort((a, b) => new Date(a.applied_date) - new Date(b.applied_date));
  chronological.forEach(app => {
    const dateKey = app.applied_date;
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });

  const labels = Object.keys(dailyCounts).map(dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  });
  const chartData = Object.values(dailyCounts);

  // Destroy previous instances
  if (type === 'you' && compareTimelineChartYou) {
    compareTimelineChartYou.destroy();
  }
  if (type === 'them' && compareTimelineChartThem) {
    compareTimelineChartThem.destroy();
  }

  const newChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: chartData,
        backgroundColor: type === 'you' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(8, 145, 178, 0.2)',
        borderColor: type === 'you' ? '#4f46e5' : '#0891b2',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: type === 'you' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(8, 145, 178, 0.4)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#64748b',
          borderColor: '#e2e8f0',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 9 } }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { 
            color: '#64748b', 
            font: { family: 'Inter', size: 9 },
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  });

  if (type === 'you') {
    compareTimelineChartYou = newChart;
  } else {
    compareTimelineChartThem = newChart;
  }
}

// ==========================================
// SINGLE VIEW CHARTS
// ==========================================
function renderSankeyChart() {
  const container = document.getElementById('sankey-chart');
  const nonPendingApps = applications.filter(app => app.decision !== 'Pending');

  if (nonPendingApps.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.85rem;">No completed applications to show. (Pending applications are hidden from funnel).</div>';
    return;
  }

  const flows = {};
  const addFlow = (source, target, weight = 1) => {
    const key = `${source} -> ${target}`;
    flows[key] = (flows[key] || 0) + weight;
  };

  nonPendingApps.forEach(app => {
    let current = 'Applied';
    if (app.oa_checked) {
      addFlow('Applied', 'Online Assessment');
      current = 'Online Assessment';
    }
    if (app.interview_checked) {
      addFlow(current, 'Interview');
      current = 'Interview';
    }

    let destination = '';
    if (app.decision === 'Offer') {
      destination = 'Offer';
    } else if (app.decision === 'Rejected') {
      destination = 'Rejected';
    } else if (app.decision === 'Withdrawn') {
      destination = 'Withdrawn';
    }
    addFlow(current, destination);
  });

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn('string', 'From');
  dataTable.addColumn('string', 'To');
  dataTable.addColumn('number', 'Weight');

  const rows = [];
  Object.keys(flows).forEach(key => {
    const [from, to] = key.split(' -> ');
    rows.push([from, to, flows[key]]);
  });
  dataTable.addRows(rows);

  const colors = ['#6366f1', '#06b6d4', '#d97706', '#16a34a', '#dc2626', '#64748b', '#a855f7'];
  const options = {
    sankey: {
      node: {
        colors: colors,
        label: { color: '#0f172a', fontFamily: 'Inter', fontSize: 11, bold: true },
        nodePadding: 24,
        width: 10,
        interactivity: true
      },
      link: {
        colorMode: 'source',
        color: { fillOpacity: 0.3 }
      }
    }
  };

  const chart = new google.visualization.Sankey(container);
  
  const observer = new ResizeObserver(() => {
    chart.draw(dataTable, options);
  });
  observer.observe(container);

  chart.draw(dataTable, options);
}

function renderTimelineChart() {
  const canvas = document.getElementById('timeline-chart');
  const ctx = canvas.getContext('2d');

  if (applications.length === 0) {
    if (timelineChart) timelineChart.destroy();
    canvas.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.85rem;">No timeline metrics.</div>';
    return;
  }

  if (!document.getElementById('timeline-chart')) {
    canvas.parentNode.innerHTML = '<canvas id="timeline-chart"></canvas>';
    return renderTimelineChart();
  }

  const dailyCounts = {};
  const chronologicalApps = [...applications].sort((a, b) => new Date(a.applied_date) - new Date(b.applied_date));
  
  chronologicalApps.forEach(app => {
    const dateKey = app.applied_date;
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });

  const labels = Object.keys(dailyCounts).map(dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  });
  const chartData = Object.values(dailyCounts);

  if (timelineChart) {
    timelineChart.destroy();
  }

  timelineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jobs Applied',
        data: chartData,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: '#4f46e5',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(79, 70, 229, 0.4)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#64748b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          titleFont: { weight: 'bold' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { 
            color: '#64748b', 
            font: { family: 'Inter', size: 10 },
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  });
}

// ==========================================
// EVENT LISTENERS & AUTH TOGGLE
// ==========================================
function setupEventListeners() {
  // Toggle Auth Mode
  authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode(authMode === 'login' ? 'signup' : 'login');
  });

  // Submit Authentication Form
  formAuth.addEventListener('submit', handleAuthSubmit);

  // Copy shareable link
  btnCopyLink.addEventListener('click', () => {
    if (currentUser) {
      const shareUrl = window.location.origin + `/shares/${currentUser.uuid}.html`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          const origText = btnCopyLink.innerHTML;
          btnCopyLink.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
          setTimeout(() => {
            btnCopyLink.innerHTML = origText;
          }, 1800);
        })
        .catch(err => {
          console.error('Failed to copy share link:', err);
          alert('Could not copy link. Manually copy the View Public Share Page URL.');
        });
    }
  });

  // Logout button
  btnLogout.addEventListener('click', () => {
    logout();
  });

  // Compare handlers
  btnCompareSubmit.addEventListener('click', handleCompareSearch);
  btnCompareClear.addEventListener('click', clearComparison);
  compareUsernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCompareSearch();
    }
  });

  // Open Application Modals
  btnAddApplication.addEventListener('click', openAddModal);

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalApp));
  });

  // Save Application Form
  formApp.addEventListener('submit', handleSaveApplication);

  // Live client-side filters
  tableSearch.addEventListener('input', filterAndRenderTable);
  tableFilterStatus.addEventListener('change', filterAndRenderTable);
}

function toggleAuthMode(mode) {
  authMode = mode;
  formAuth.reset();
  
  if (authMode === 'login') {
    authSubtitle.textContent = 'Sign in to manage your applications';
    authNameGroup.style.display = 'none';
    authName.removeAttribute('required');
    authUsernameGroup.style.display = 'none';
    authUsername.removeAttribute('required');
    btnAuthSubmit.textContent = 'Sign In';
    authSwitchText.innerHTML = `Don't have an account? <a href="#" id="auth-switch-link">Create one</a>`;
  } else {
    authSubtitle.textContent = 'Create an account to start tracking';
    authNameGroup.style.display = 'flex';
    authName.setAttribute('required', 'required');
    authUsernameGroup.style.display = 'flex';
    authUsername.setAttribute('required', 'required');
    btnAuthSubmit.textContent = 'Register';
    authSwitchText.innerHTML = `Already have an account? <a href="#" id="auth-switch-link">Sign In</a>`;
  }

  const newLink = document.getElementById('auth-switch-link');
  newLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode(authMode === 'login' ? 'signup' : 'login');
  });
}

// ==========================================
// FORM SUBMIT HANDLERS
// ==========================================
async function handleAuthSubmit(e) {
  e.preventDefault();

  const payload = {
    email: authEmail.value.trim(),
    password: authPassword.value
  };

  let endpoint = '/api/auth/login';

  if (authMode === 'signup') {
    payload.name = authName.value.trim();
    payload.username = authUsername.value.trim().toLowerCase();
    endpoint = '/api/auth/register';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      
      showDashboardScreen();
      fetchApplications();
    } else {
      alert(data.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Authentication request error:', error);
    alert('Failed to connect to authentication endpoints.');
  }
}

async function handleSaveApplication(e) {
  e.preventDefault();

  const appId = formAppId.value;
  const pipelineVal = formPipelineStatus.value;

  const payload = {
    company: formCompany.value.trim(),
    title: formTitle.value.trim(),
    applied_date: formAppliedDate.value,
    oa_checked: pipelineVal === 'Online Assessment' || pipelineVal === 'Interview',
    interview_checked: pipelineVal === 'Interview',
    decision: formDecision.value
  };

  try {
    let response;
    if (appId) {
      response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (response.ok) {
      closeModal(modalApp);
      await fetchApplications();
    } else {
      const err = await response.json();
      alert(`Error saving: ${err.error}`);
    }
  } catch (error) {
    console.error('Error saving application:', error);
  }
}

async function handleDeleteApp(id) {
  if (!confirm('Are you sure you want to delete this application?')) {
    return;
  }

  try {
    const response = await fetch(`/api/applications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      await fetchApplications();
    } else {
      alert('Failed to delete application.');
    }
  } catch (error) {
    console.error('Error deleting application:', error);
  }
}

// ==========================================
// MODAL ACTIONS
// ==========================================
function openAddModal() {
  modalAppTitle.textContent = 'Add Job Application';
  formApp.reset();
  formAppId.value = '';

  const today = getTodayDateStr();
  formAppliedDate.value = today;
  formPipelineStatus.value = 'Applied';
  formDecision.value = 'Pending';

  openModal(modalApp);
}

function openEditModal(id) {
  const app = applications.find(a => a.id == id);
  if (!app) return;

  modalAppTitle.textContent = 'Edit Job Application';
  formAppId.value = app.id;
  formCompany.value = app.company;
  formTitle.value = app.title;
  formAppliedDate.value = app.applied_date;
  
  let pipelineVal = 'Applied';
  if (app.interview_checked) {
    pipelineVal = 'Interview';
  } else if (app.oa_checked) {
    pipelineVal = 'Online Assessment';
  }
  formPipelineStatus.value = pipelineVal;
  formDecision.value = app.decision;

  openModal(modalApp);
}

function openModal(modal) {
  modal.classList.add('open');
}

function closeModal(modal) {
  modal.classList.remove('open');
}

// ==========================================
// HELPERS
// ==========================================
function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
