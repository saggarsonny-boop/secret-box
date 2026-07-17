const fs = require(\'fs\');
const path = require(\'path\');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyDirSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const originalSymlinkSync = fs.symlinkSync;
fs.symlinkSync = function (target, pathStr, type) {
  try {
    const absoluteTarget = path.resolve(path.dirname(pathStr), target);
    if (fs.existsSync(absoluteTarget)) {
      const stats = fs.statSync(absoluteTarget);
      if (stats.isDirectory()) {
        if (fs.existsSync(pathStr)) {
          fs.rmSync(pathStr, { recursive: true, force: true });
        }
        copyDirSync(absoluteTarget, pathStr);
        return;
      }
    }
    return originalSymlinkSync.apply(this, arguments);
  } catch (err) {
    try {
      const absoluteTarget = path.resolve(path.dirname(pathStr), target);
      if (fs.existsSync(absoluteTarget)) {
        if (fs.existsSync(pathStr)) {
          fs.rmSync(pathStr, { recursive: true, force: true });
        }
        if (fs.statSync(absoluteTarget).isDirectory()) {
          copyDirSync(absoluteTarget, pathStr);
        } else {
          fs.copyFileSync(absoluteTarget, pathStr);
        }
        return;
      }
    } catch (e) {}
    throw err;
  }
};

const originalSymlink = fs.symlink;
fs.symlink = function (target, pathStr, type, callback) {
  if (typeof type === \'function\') {
    callback = type;
    type = undefined;
  }
  try {
    fs.symlinkSync(target, pathStr, type);
    if (callback) callback(null);
  } catch (err) {
    if (callback) callback(err);
    else throw err;
  }
};
