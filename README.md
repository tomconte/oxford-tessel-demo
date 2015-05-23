# Tessel Camera module + Project Oxford Face API demo

This repo shows how to use the Project Oxford Face APIs from a Tessel device. It uses the Camera module (plugged in port "A") to take a picture when the Config button is pressed. The picture is then uploaded to Azure Blob Storage using a Shared Access Signature for authorization. Finally, the resulting picture URL is sent to the Project Oxford Face Detection API in order to detect faces in the picture.

The result from the Face API call tells us if it found a face in the picture, and if yes it tries to evaluate its gender and age.

In this demo, a LED plugged in GPIO port G3 in turned on if a face is detected.
