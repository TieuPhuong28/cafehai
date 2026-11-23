// ===== Quầy – chế độ online: đăng nhập nhân viên, nhận đơn từ Firestore =====
(() => {
  if (!Cloud.enabled) return;
  document.getElementById('clearBtn')?.classList.add('hidden');

  // Màn đăng nhập quầy
  const gate = document.createElement('div');
  gate.className = 'staff-gate';
  document.body.appendChild(gate);
  let error = '', busy = false, started = false;

  function showGate() {
    gate.classList.remove('hidden');
    const u = Cloud.user;
    gate.innerHTML = `
      <form class="sg-card" id="staffForm" autocomplete="on">
        <div class="sg-logo"><svg viewBox="0 0 40 40"><rect x="2.5" y="2.5" width="35" height="35" fill="none" stroke="#7a2e1f" stroke-width="3"/><path d="M12 8v24M28 8v24M12 20h16" stroke="#7a2e1f" stroke-width="6" fill="none"/></svg></div>
        <h2>Màn hình quầy</h2>
        ${u && !Cloud.isStaff ? `<p class="sg-warn">Tài khoản <b>${esc(u.email)}</b> chưa được cấp quyền quầy.</p><button class="btn ghost" type="button" id="sgOut">Đăng xuất</button>` : `
        <label><span>Email nhân viên</span><input name="email" type="email" required autocomplete="username"></label>
        <label><span>Mật khẩu</span><input name="password" type="password" required autocomplete="current-password"></label>
        ${error ? `<p class="sg-warn">⚠️ ${esc(error)}</p>` : ''}
        <button class="btn primary" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>`}
      </form>`;
    gate.querySelector('#sgOut')?.addEventListener('click', () => Cloud.logout());
  }

  gate.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    busy = true; error = ''; showGate();
    try { await Cloud.staffLogin(String(f.get('email')).trim(), String(f.get('password'))); }
    catch (err) { error = Cloud.niceError(err); }
    busy = false;
    if (!Cloud.isStaff) showGate();
  });

  // Nút đăng xuất trên thanh trên cùng
  const out = document.createElement('button');
  out.className = 'btn ghost hidden';
  out.textContent = 'Đăng xuất';
  out.onclick = () => { if (confirm('Đăng xuất màn hình quầy?')) Cloud.logout(); };
  document.querySelector('.q-top').appendChild(out);

  Cloud.on('auth', () => {
    if (Cloud.isStaff) {
      gate.classList.add('hidden');
      out.classList.remove('hidden');
      if (!started) {
        started = true;
        let first = true;
        Cloud.watchAllOrders(list => {
          if (first) { list.forEach(o => seen.add(o.id)); first = false; } // đơn cũ không báo chuông
          Store.setCloud(list);
        });
      }
    } else {
      out.classList.add('hidden');
      showGate();
    }
  });
  Cloud.on('error', msg => toast('⚠️ ' + msg));
  showGate();
})();
