// Auto-format phone: (555) 123-4567
document.getElementById('df-phone').addEventListener('input', function(e) {
  var x = e.target.value.replace(/\D/g, '').substring(0, 10);
  var formatted = '';
  if (x.length > 0) formatted = '(' + x.substring(0, 3);
  if (x.length >= 3) formatted += ') ' + x.substring(3, 6);
  if (x.length >= 6) formatted += '-' + x.substring(6, 10);
  e.target.value = formatted;
});

// Live email validation on blur
document.getElementById('df-email').addEventListener('blur', function() {
  var val = this.value.trim();
  var hint = document.getElementById('email-hint');
  if (!val) { hint.style.display = 'none'; return; }
  if (!val.includes('@')) {
    hint.textContent = 'Missing @ — try something like john@company.com';
    hint.style.display = 'block';
  } else if (val.indexOf('@') === 0) {
    hint.textContent = 'Add your name before the @ symbol';
    hint.style.display = 'block';
  } else if (!val.split('@')[1] || !val.split('@')[1].includes('.')) {
    hint.textContent = 'Missing domain — did you mean ' + val + '.com?';
    hint.style.display = 'block';
  } else if (val.endsWith('.')) {
    hint.textContent = 'Looks incomplete — check the ending';
    hint.style.display = 'block';
  } else {
    hint.style.display = 'none';
  }
});
document.getElementById('df-email').addEventListener('input', function() {
  document.getElementById('email-hint').style.display = 'none';
});

function submitToHubSpot() {
  var overlay = document.getElementById('captcha-overlay');

  var data = {
    portalId: '245289942',
    formGuid: 'b4de1cce-2bcb-4ff8-a34c-5bc5140899d1',
    fields: [
      { name: 'firstname', value: document.getElementById('df-fname').value },
      { name: 'lastname', value: document.getElementById('df-lname').value },
      { name: 'email', value: document.getElementById('df-email').value },
      { name: 'company', value: document.getElementById('df-company').value },
      { name: 'phone', value: '+1' + document.getElementById('df-phone').value.replace(/\D/g, '') },
      { name: 'jobtitle', value: document.getElementById('df-role').value },
      { name: 'company_size_installsmonth', value: document.getElementById('df-size').value },
      { name: 'message', value: document.getElementById('df-msg').value }
    ]
  };

  fetch('https://api.hsforms.com/submissions/v3/integration/submit/245289942/b4de1cce-2bcb-4ff8-a34c-5bc5140899d1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(res) {
    overlay.style.display = 'none';
    if (res.ok) {
      document.getElementById('demo-panel').style.display = 'none';
      document.getElementById('demo-success-panel').style.display = 'block';
    } else {
      document.getElementById('demo-error').style.display = 'block';
      grecaptcha.reset();
    }
  }).catch(function() {
    overlay.style.display = 'none';
    document.getElementById('demo-error').style.display = 'block';
    grecaptcha.reset();
  });
}

function onCaptchaComplete() {
  submitToHubSpot();
}

document.getElementById('demo-btn').addEventListener('click', function() {
  var errEl = document.getElementById('demo-error');
  var fname = document.getElementById('df-fname').value.trim();
  var lname = document.getElementById('df-lname').value.trim();
  var email = document.getElementById('df-email').value.trim();
  var company = document.getElementById('df-company').value.trim();
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var errors = [];
  if (!fname) errors.push('First Name');
  if (!lname) errors.push('Last Name');
  if (!email) errors.push('Work Email');
  else if (!emailRegex.test(email)) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    document.getElementById('df-email').focus();
    return;
  }
  if (!company) errors.push('Company Name');

  if (errors.length > 0) {
    errEl.textContent = 'Please fill in: ' + errors.join(', ');
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  document.getElementById('captcha-overlay').style.display = 'flex';
});

document.getElementById('captcha-cancel').addEventListener('click', function() {
  document.getElementById('captcha-overlay').style.display = 'none';
  grecaptcha.reset();
});
