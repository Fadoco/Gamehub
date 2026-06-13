const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadModule(fileName) {
  const fullPath = path.join(__dirname, '..', 'java', 'modules', fileName);
  const code = fs.readFileSync(fullPath, 'utf8');

  const context = {
    window: {},
    document: { readyState: 'complete' },
    console,
    firebase: { auth: () => ({}) },
    setTimeout,
    clearTimeout,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };

  context.window = context;
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window;
}

(function main() {
  const loginWindow = loadModule('login.js');
  assert.strictEqual(typeof loginWindow.LoginModule, 'object');
  assert.strictEqual(typeof loginWindow.LoginModule.login, 'function');

  const registerWindow = loadModule('register.js');
  assert.strictEqual(typeof registerWindow.RegisterModule, 'object');
  assert.strictEqual(typeof registerWindow.RegisterModule.signup, 'function');

  const sessionWindow = loadModule('session.js');
  assert.strictEqual(typeof sessionWindow.SessionModule, 'object');
  assert.strictEqual(typeof sessionWindow.SessionModule.restoreSession, 'function');
  assert.strictEqual(typeof sessionWindow.SessionModule.logout, 'function');

  const permissionsWindow = loadModule('permissions.js');
  assert.strictEqual(typeof permissionsWindow.PermissionsModule, 'object');
  assert.strictEqual(typeof permissionsWindow.PermissionsModule.isAdmin, 'function');

  const userMenuWindow = loadModule('user-menu.js');
  assert.strictEqual(typeof userMenuWindow.UserMenuModule, 'object');
  assert.strictEqual(typeof userMenuWindow.UserMenuModule.renderUserMenu, 'function');

  console.log('auth-modules test passed');
})();
