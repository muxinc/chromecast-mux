import AWS from 'aws-sdk';
import fs from 'fs';
import pkg from '../package.json';

let environment = process.env.NODE_ENV || 'staging';
let bucketName;

if (environment === 'production') {
  bucketName = 'mux-sdks';
} else {
  bucketName = 'mux-sdks-test';
}

let fullVersion = pkg.version;
let majorVersion = fullVersion.split('.')[0];

let coreFile = fs.readFileSync('dist/chromecast-mux.js');
let receiverHtml = fs.readFileSync('sample_app/receiver/index.html');
let receiverJs = fs.readFileSync('sample_app/receiver/js/main.js');
let receiverCss = fs.readFileSync('sample_app/receiver/css/style.css');
let bucket = new AWS.S3({params: {Bucket: bucketName}});

Promise.all([
  uploadFile(bucket, coreFile, `chromecast/${fullVersion}/chromecast-mux.js`, 'application/javascript'),
  uploadFile(bucket, coreFile, `chromecast/${majorVersion}/chromecast-mux.js`, 'application/javascript'),
  uploadFile(bucket, receiverHtml, `chromecast/${fullVersion}/receiver/index.html`, 'text/html'),
  uploadFile(bucket, receiverHtml, `chromecast/${majorVersion}/receiver/index.html`, 'text/html'),
  uploadFile(bucket, receiverJs, `chromecast/${fullVersion}/receiver/js/main.js`, 'application/javascript'),
  uploadFile(bucket, receiverJs, `chromecast/${majorVersion}/receiver/js/main.js`, 'application/javascript'),
  uploadFile(bucket, receiverCss, `chromecast/${fullVersion}/receiver/css/style.css`, 'text/css'),
  uploadFile(bucket, receiverCss, `chromecast/${majorVersion}/receiver/css/style.css`, 'text/css')
]).then((data) => {
  console.log(data);
  console.log('\n\nSuccess!');
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

function uploadFile (bucket, file, key, contentType) {
  return new Promise((resolve, reject) => {
    let params = {
      Body: file,
      Key: key,
      ACL: 'public-read',
      ContentType: contentType
    };

    bucket.upload(params, function (err, data) {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
}
