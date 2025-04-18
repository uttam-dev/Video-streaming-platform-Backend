import fs from 'fs';

const unlinkFiles = (req) => {
  // const cleanup = () => {
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          fs.unlink(file.path, err => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('Deleted temp file:', file.path);
            }
          });
        });
      });
    // }
  };
  // res.on('finish', cleanup); // Normal response
  // res.on('close', cleanup);  // Client aborted
  // res.on('error', cleanup);  // Server error
};

export {unlinkFiles};
