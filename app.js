// ==========================================
// MOCK STATE MANAGEMENT
// ==========================================
const currentUser = {
  name: 'Jane Doe',
  username: 'jane',
  uuid: 'jane-doe-portfolio-uuid-12345'
};

// Seed Jane Doe's applications
let applications = [
  {
    id: 1,
    company: 'Google',
    title: 'Software Engineer',
    applied_date: getPastDateStr(90),
    oa_checked: true,
    interview_checked: true,
    decision: 'Offer'
  },
  {
    id: 2,
    company: 'Meta',
    title: 'Production Engineer',
    applied_date: getPastDateStr(75),
    oa_checked: true,
    interview_checked: true,
    decision: 'Rejected'
  },
  {
    id: 3,
    company: 'Stripe',
    title: 'Fullstack Engineer',
    applied_date: getPastDateStr(60),
    oa_checked: true,
    interview_checked: true,
    decision: 'Withdrawn'
  },
  {
    id: 4,
    company: 'Netflix',
    title: 'UI Engineer',
    applied_date: getPastDateStr(45),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 5,
    company: 'Amazon',
    title: 'Software Development Engineer',
    applied_date: getPastDateStr(35),
    oa_checked: true,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 6,
    company: 'Microsoft',
    title: 'Solutions Architect',
    applied_date: getPastDateStr(21),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 7,
    company: 'OpenAI',
    title: 'Research Engineer',
    applied_date: getPastDateStr(14),
    oa_checked: false,
    interview_checked: true,
    decision: 'Pending'
  },
  {
    id: 8,
    company: 'Tesla',
    title: 'Firmware Engineer',
    applied_date: getPastDateStr(14),
    oa_checked: true,
    interview_checked: false,
    decision: 'Rejected'
  },
  {
    id: 9,
    company: 'Airbnb',
    title: 'Backend Engineer',
    applied_date: getPastDateStr(7),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 10,
    company: 'Uber',
    title: 'Systems Engineer',
    applied_date: getPastDateStr(4),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 11,
    company: 'Figma',
    title: 'Product Engineer',
    applied_date: getPastDateStr(2),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  },
  {
    id: 12,
    company: 'Slack',
    title: 'Front End Engineer',
    applied_date: getPastDateStr(0),
    oa_checked: false,
    interview_checked: false,
    decision: 'Pending'
  }
];

// Seed Bob Smith's data for comparison
const mockUsers = {
  bob: {
    name: 'Bob Smith',
    username: 'bob',
    applications: [
      {
        id: 101,
        company: 'Meta',
        title: 'Software Engineer',
        applied_date: getPastDateStr(40),
        oa_checked: true,
        interview_checked: true,
        decision: 'Offer'
      },
      {
        id: 102,
        company: 'Amazon',
        title: 'Software Engineer',
        applied_date: getPastDateStr(30),
        oa_checked: true,
        interview_checked: true,
        decision: 'Rejected'
      },
      {
        id: 103,
        company: 'Microsoft',
        title: 'Software Engineer',
        applied_date: getPastDateStr(20),
        oa_checked: false,
        interview_checked: false,
        decision: 'Pending'
      },
      {
        id: 104,
        company: 'Netflix',
        title: 'UI Engineer',
        applied_date: getPastDateStr(18),
        oa_checked: true,
        interview_checked: false,
        decision: 'Rejected'
      },
      {
        id: 105,
        company: 'Apple',
        title: 'iOS Engineer',
        applied_date: getPastDateStr(10),
        oa_checked: false,
        interview_checked: false,
        decision: 'Pending'
      },
      {
        id: 106,
        company: 'Uber',
        title: 'Backend Engineer',
        applied_date: getPastDateStr(7),
        oa_checked: false,
        interview_checked: false,
        decision: 'Pending'
      },
      {
        id: 107,
        company: 'Lyft',
        title: 'Fullstack Engineer',
        applied_date: getPastDateStr(5),
        oa_checked: false,
        interview_checked: false,
        decision: 'Pending'
      },
      {
        id: 108,
        company: 'Airbnb',
        title: 'Backend Engineer',
        applied_date: getPastDateStr(1),
        oa_checked: false,
        interview_checked: false,
        decision: 'Pending'
      }
    ]
  }
};

let timelineChart = null;
let comparedUser = null;
let compareTimelineChartYou = null;
let compareTimelineChartThem = null;

// ==========================================
// DOM ELEMENTS
// ==========================================
const btnCopyLink = document.getElementById('btn-copy-link');

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
  updateDashboard();
});

window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateDashboard();
});

// ==========================================
// UI DRAWING / UPDATES
// ==========================================
function updateDashboard() {
  applications.sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date));
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

// In-memory Pipeline status changer
function handleInlinePipelineChange(e) {
  const appId = parseInt(e.target.getAttribute('data-id'));
  const value = e.target.value;

  const app = applications.find(a => a.id === appId);
  if (app) {
    app.oa_checked = value === 'Online Assessment' || value === 'Interview';
    app.interview_checked = value === 'Interview';
    updateDashboard();
  }
}

// In-memory Decision status changer
function handleInlineDecisionChange(e) {
  const appId = parseInt(e.target.getAttribute('data-id'));
  const value = e.target.value;

  const app = applications.find(a => a.id === appId);
  if (app) {
    app.decision = value;
    updateDashboard();
  }
}

// ==========================================
// HEAD-TO-HEAD COMPARISON CONTROLLERS
// ==========================================
function handleCompareSearch() {
  const targetUsername = compareUsernameInput.value.trim().toLowerCase();
  
  if (!targetUsername) {
    alert('Please enter a username to compare.');
    return;
  }

  if (targetUsername === currentUser.username.toLowerCase()) {
    alert("You cannot compare stats against yourself.");
    return;
  }

  const them = mockUsers[targetUsername];
  if (!them) {
    alert(`Candidate user "${targetUsername}" not found. Try entering 'bob'.`);
    clearComparison();
    return;
  }

  comparedUser = them;
  
  // Toggle Layouts
  singleUserView.style.display = 'none';
  comparisonView.style.display = 'block';
  btnCompareClear.style.display = 'inline-flex';

  renderComparisonGraphics();
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
  highlightComparisonWinners(compareMetricsYouInterview, compareMetricsThemInterview, youRate, themRate);

  // 4. Render Sankeys side-by-side
  if (google.visualization && google.visualization.Sankey) {
    drawCompareSankey('compare-sankey-you', applications);
    drawCompareSankey('compare-sankey-them', comparedUser.applications);
  }

  // 5. Render Timelines side-by-side
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
// EVENT LISTENERS & IN-MEMORY FORMS
// ==========================================
function setupEventListeners() {
  // Copy shareable link
  btnCopyLink.addEventListener('click', () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        const origText = btnCopyLink.innerHTML;
        btnCopyLink.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
        setTimeout(() => {
          btnCopyLink.innerHTML = origText;
        }, 1800);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
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

  // Save Application Form (In-Memory)
  formApp.addEventListener('submit', handleSaveApplication);

  // Live client-side filters
  tableSearch.addEventListener('input', filterAndRenderTable);
  tableFilterStatus.addEventListener('change', filterAndRenderTable);
}

// In-Memory Form Submit
function handleSaveApplication(e) {
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

  if (appId) {
    // Edit existing
    const app = applications.find(a => a.id == appId);
    if (app) {
      Object.assign(app, payload);
    }
  } else {
    // Add new
    const nextId = applications.length ? Math.max(...applications.map(a => a.id)) + 1 : 1;
    applications.push({
      id: nextId,
      ...payload
    });
  }

  closeModal(modalApp);
  updateDashboard();
}

function handleDeleteApp(id) {
  if (!confirm('Are you sure you want to delete this application?')) {
    return;
  }

  applications = applications.filter(a => a.id != id);
  updateDashboard();
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
function getPastDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

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
