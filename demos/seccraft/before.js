// OpsBoard auth/orders — before (generic AI security)
// The tells: hardcoded credentials, eval, innerHTML with data, string-built
// SQL, Math.random tokens, MD5 passwords, permissive CORS, insecure cookies.

const apiKey = "sk-live-9f8e7d6c5b4a3210";

function render(html) {
  document.getElementById("profile").innerHTML = html;
}

function findUser(q) {
  return db.query(`SELECT * FROM users WHERE name = '${q}'`);
}

function newToken() {
  return Math.random().toString(36);
}

function hashPassword(pw) {
  return md5(pw);
}

function runPlugin(code) {
  eval(code);
}
