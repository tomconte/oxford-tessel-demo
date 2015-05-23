var tessel = require('tessel');
var https = require('https');

var gpio = tessel.port['GPIO'];

var notificationLED = tessel.led[1];

/*
** Azure Blob Storage parameters
*/

var blob_host = 'tconeu.blob.core.windows.net';
var blob_container = 'tessel-uploads';
// Use any tool to generate a Shared Access Key e.g. Azure Management Studio, Azure Storage Explorer...
// or PowerShell: New-AzureStorageContainerSASToken -Name test -Permission rwdl
var blob_sas = '?sv=2014-02-14&sr=c&sig=xxxx&se=2019-12-31T23%3A00%3A00Z&sp=rwdl';

/*
** Project Oxford Face API parameters
*/

// Request gender & age analysis
var faceapi_request = '/face/v0/detections?analyzesFaceLandmarks=false&analyzesAge=true&analyzesGender=true&analyzesHeadPose=false';
// Get your key at http://www.projectoxford.ai/
var oxford_key = 'xxxx';

/*
** Upload a picture to Azure
*/

function uploadPicture(name, image)
{
  var url = 'http://' + blob_host + '/' + blob_container + '/' + name;
  
  var options = {
    hostname: blob_host,
    port: 80,
    path: '/' + blob_container + '/' + name + blob_sas,
    method: 'PUT',
    headers: {
      'Content-Length' : image.length,
      'x-ms-blob-type' : 'BlockBlob',
      'Content-Type' : 'image/jpeg'
    }
  };

  var req = https.request(options, function(res) {
    console.log("Blob upload: ", res.statusCode);

    res.on('data', function(d) {
      console.log(d);
    });
    
    // Now that the Blob is uploaded,
    // call the Face API
    
    faceDetect(url);
  });

  req.on('error', function(e) {
    console.error(e);
  });

  req.write(image);
  req.end();

  // Return full URL of the uploaded image
  return url;
}

/*
** Take a picture using the Camera module
*/

function takePicture() {
  // Turn on LED
  notificationLED.high();
  // Take a picture
  camera.takePicture(function(err, image) {
    if (err) {
      console.log('error taking image', err);
    } else {
      // Turn off LED
      notificationLED.low();
      // Name the image
      var name = 'picture-' + Math.floor(Date.now()*1000) + '.jpg';
      // Upload the image
      console.log('Uploading picture as', name, '...');
      var url = uploadPicture(name, image);
      console.log(url);
    }	
  });
}

/*
** Project Oxford Face API
*/

function faceDetect(url) {
	var json = JSON.stringify({'url':url});

  console.log('Call Face API on ' + url);

  var options = {
    hostname: 'api.projectoxford.ai',
    port: 80,
    path: faceapi_request,
    method: 'POST',
    headers: {
		  'Host': 'api.projectoxford.ai',
      'Content-Length' : json.length,
      'Content-Type' : 'application/json',
      'Ocp-Apim-Subscription-Key': oxford_key
    }
  };

  var req = https.request(options, function(res) {
    console.log("Face API: ", res.statusCode);
    
    res.on('data', function(d) {
      // Log result in case of error
      if (res.statusCode != 200) {
        console.log(d);
        return;
      } 

      // Face API response
      var face = JSON.parse(d);
      
      if (face.length == 0) {

        // No face detected
        console.log("\nNO FACE DETECTED\n");

        // Turn off "big" LED
        gpio.pin['G3'].output(false);        

      } else {

        // Face was detected
        console.log("\nFACE DETECTED\n");
        console.log(face[0].faceId);
        console.log(face[0].attributes.gender);
        console.log(face[0].attributes.age);        

        // Turn on "big" LED
        gpio.pin['G3'].output(true);        

      }
    });
  });

  req.on('error', function(e) {
    console.error(e);
  });

	req.write(json);
  req.end();
}

/*
** Set up the Camera module
*/

var camera = require('camera-vc0706').use(tessel.port['A']);

camera.on('ready', function() {
  console.log('Camera ready!');
});

camera.on('error', function(err) {
  console.error(err);
});

tessel.button.on('press', function() {
  takePicture();
});
