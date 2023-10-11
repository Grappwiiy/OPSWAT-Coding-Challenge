import React, { useState, useEffect } from "react";

export default function OPSWAT() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [dataID, setDataID] = useState(null);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      calculateHash(file);
    }
  };

  const calculateHash = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const hashArray = await crypto.subtle.digest('SHA-256', buffer);
      const hashHex = Array.from(new Uint8Array(hashArray))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      setHash(hashHex);
    };

    reader.readAsArrayBuffer(file);

  };

  const api = "79987ad6fddbb4efcf41ca448dc81be4";


  const fileScanner = async () => {
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResponse = await fetch('https://api.metadefender.com/v4/file', {
        method: 'POST',
        headers: {
          'apikey': '79987ad6fddbb4efcf41ca448dc81be4',
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      setDataID(uploadResult.data_id)
      } catch (e) {
      console.log(e);
    }
  }

  const hashLookUp = async () => {
    try {
      const response = await fetch('https://api.metadefender.com/v4/hash', {
        method: 'POST',
        headers: {
          'apikey': '79987ad6fddbb4efcf41ca448dc81be4',
          'Content-Type': 'application/json' // Remove the extra tab character here
        },
        body: JSON.stringify({ // Correctly stringify the JSON body
          'hash': [hash],
        })
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      // console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  const pollCheckOut = async () => {
    try{
      const checkOutResponse = await fetch(`https://api.metadefender.com/v4/file/${dataID}`, {
        method: 'GET',
        headers: {
          'apikey': '79987ad6fddbb4efcf41ca448dc81be4',
        },
      });

      const checkOutResult = await checkOutResponse.json();
      const percentage = checkOutResult.process_info.progress_percentage;
      if(Number(percentage) < 100) {
        console.log(percentage);
        console.log(checkOutResult);
      } else if (Number(percentage) == 100) {
        stopPolling();
        console.log(checkOutResult);
        console.log(percentage);
      }
    }catch (e) {
      console.log(e);
    }

  }

  let pollingInterval;

  const startPolling = () => {
    pollCheckOut();
    pollingInterval = setInterval(() => {
      pollCheckOut();
    }, 10000);
  };

  const stopPolling = () => {
    // Stop polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };


  return (
    <div>
       <input type="file" onChange={handleFileChange} />

       {hash && (
        <div>
          <h2>SHA-256 Hash:</h2>
          <p>{hash}</p>
          <button onClick={hashLookUp} >hashlookup</button>
          <button onClick={fileScanner}>upload</button>
          <button onClick={startPolling}>pooling</button>
        </div>
      )}
    </div>
  );
}

