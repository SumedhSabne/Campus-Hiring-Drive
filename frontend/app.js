const API = 'http://localhost:4000/api';
async function loadCandidates() {
  const res = await fetch(API + '/candidates');
  const data = await res.json();
  window._candidates = data;
  renderCandidates(data);
}
function renderCandidates(list) {
  const container = document.getElementById('candidates');
  container.innerHTML = '';
  if (!list.length) container.innerHTML = '<p class="text-muted">No candidates found.</p>';
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'col-md-4';
    card.innerHTML = `
      <div class="card card-resume shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${c.name}</h5>
          <p class="card-text">
            <strong>Branch:</strong> ${c.branch} <br>
            <strong>CGPA:</strong> ${c.cgpa} <br>
            <strong>Email:</strong> ${c.email}
          </p>
          <a href="#" class="btn btn-outline-primary btn-sm" onclick="downloadResume('${c.resumePath || ''}')">View resume</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}
function downloadResume(path) {
  if (!path) return alert('No resume attached.');
  // if path points to sample_resumes, we open it relative to project (frontend cannot access backend upload folder)
  alert('Open the resume file from the project folder: ' + path);
}

document.getElementById('btnFilter').addEventListener('click', () => {
  const branch = document.getElementById('filterBranch').value.trim().toLowerCase();
  const cgpa = parseFloat(document.getElementById('filterMinCgpa').value || '0');
  let list = window._candidates || [];
  if (branch) list = list.filter(c => (c.branch || '').toLowerCase().includes(branch));
  if (!isNaN(cgpa) && cgpa > 0) list = list.filter(c => parseFloat(c.cgpa) >= cgpa);
  renderCandidates(list);
});
document.getElementById('btnReset').addEventListener('click', () => { document.getElementById('filterBranch').value=''; document.getElementById('filterMinCgpa').value=''; renderCandidates(window._candidates || []); });

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const formData = new FormData(f);
  const name = formData.get('name');
  const payload = {
    name,
    email: formData.get('email'),
    branch: formData.get('branch'),
    cgpa: formData.get('cgpa')
  };
  // create candidate
  const res = await fetch(API + '/candidates', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const created = await res.json();
  // if file upload exists, upload
  const file = f.querySelector('input[name="resume"]').files[0];
  if (file) {
    const fd = new FormData();
    fd.append('resume', file);
    fd.append('candidateId', created.id);
    await fetch('http://localhost:4000/upload-resume', { method: 'POST', body: fd, mode: 'cors' });
  }
  alert('Application submitted: ' + created.name);
  f.reset();
  loadCandidates();
});

loadCandidates();
