import axios from 'axios';

export async function getPresignedUrl(token, fileName, fileType) {
  try {
    const response = await axios.post(
      import.meta.env.VITE_AWS_GATEWAY_PRESIGNED_URL_ENDPOINT,
      {
        fileName,
        fileType
      },
      {
        headers: {
          Authorization: token,  
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
    
  } catch (error) {
    const message = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || "No se pudo obtener la URL";
    
    throw new Error(message);
  }
}

export async function uploadFile(uploadUrl, file) {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type
      },

      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return true;
    
  } catch (error) {
    const message = error.response?.data 
      || error.message 
      || "Error subiendo archivo";
    
    throw new Error(`Error subiendo archivo: ${message}`);
  }
}