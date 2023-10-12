import React, {useState } from "react";
import "./_app.css"


export default function OPSWAT() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [hash256Scan, setHash256Scan] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [additionalInformations, setAdditionalInformations] = useState({
    fileName: '',
    overAllStatus: ''
  });
  const [dataID, setDataID] = useState(null);
  const apiKey = process.env.REACT_APP_OPSWAT_API_KEY;


//Manipulator pentru fisierul incarcat
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      setSelectedFile(file);
      calculateHash(file);
    }
  };




//Calculator de HASH
  const calculateHash = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const hashArray = await crypto.subtle.digest('SHA-256', buffer);
      const hashHex = Array.from(new Uint8Array(hashArray))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      setHash256Scan(hashHex);
    };

    reader.readAsArrayBuffer(file);

  };

 
//Verificator de HASH prin API => in cazul in care exista HASH afiseaza informatiile despre acel fisier || in cazul in care nu exista, seteaza informatiile pe null pentru un viitor upload.  
  const hashLookUp = async () => {

    try {
      const hashLookUpResponse = await fetch(`https://api.metadefender.com/v4/hash/${hash256Scan}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });
      
      const hashLookUpResult = await hashLookUpResponse.json();
      if(hashLookUpResult.data_id) {
        if (hashLookUpResult.scan_results && hashLookUpResult.scan_results.scan_details) {
          setScanResults(hashLookUpResult.scan_results.scan_details);
          if(hashLookUpResult.scan_results.scan_all_result_a === "No Threat Detected") {
            hashLookUpResult.scan_results.scan_all_result_a = "Clean";
          }
          setAdditionalInformations({
            fileName: hashLookUpResult.file_info.display_name,
            overAllStatus: hashLookUpResult.scan_results.scan_all_result_a
          });
        }
      }else {
        setScanResults(null);
        setAdditionalInformations(null);
      }
    } catch (e) {
      }
  };


  //Incarcare fisier daca acesta nu exista
  const fileUploder = async () => {
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResponse = await fetch('https://api.metadefender.com/v4/file', {
        method: 'POST',
        headers: {
          'apikey': apiKey,
        },
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      setDataID(uploadResult.data_id);
      } catch (e) {
      console.log(e);
    }
  }

//Verificare in cazul unui fisier nou incarcat, aceasta functie este direct legata la functia startPooling(), respectiv stopPooling(). 
  const pollCheckOut = async () => {
    try{
      const checkOutResponse = await fetch(`https://api.metadefender.com/v4/file/${dataID}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      });

      const checkOutResult = await checkOutResponse.json();
      const percentage = checkOutResult.process_info.progress_percentage;
      if (Number(percentage) === 100) {
        stopPolling();
        setScanResults(checkOutResult.scan_results.scan_details);
        if(checkOutResult.scan_results.scan_all_result_a === "No Threat Detected") {
          checkOutResult.scan_results.scan_all_result_a = "Clean";
        }
        setAdditionalInformations({
          fileName: checkOutResult.file_info.display_name,
          overAllStatus: checkOutResult.scan_results.scan_all_result_a
        });
      }
    }catch (e) {
      console.log(e);
    }

  }


  let pollingInterval;

  const startPolling = () => {
    pollingInterval = setInterval(() => {
      pollCheckOut();
    }, 10000);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };





  return (
    <div className="opswatCoding">

    <label className="customFileUpload">
        <input className="inputFile" type="file" onChange={handleFileChange}/>
        Upload your file
    </label>

      {selectedFile && (
        <p>{selectedFile.name}</p>
      )}

       {hash256Scan && (
          <div className="hashText">
          <h2>SHA-256 Hash:</h2>
          <p>{hash256Scan}</p>
          <button className="buttonSanitizer" onClick={hashLookUp}>Perform a hash lookup</button>
          </div>
      )}
      {scanResults != null && additionalInformations != null ? (
          <div className="scanResultMapping">
            <p>SAMPLE OUTPUT:</p>
            <p>Filename: {additionalInformations.fileName}</p>
            <p>OverallStatus: {additionalInformations.overAllStatus}</p>
          {Object.entries(scanResults).map(([scanner, details]) => (
              <div className="scanResult" key={scanner}>
                <p>Engine: {scanner}</p>
                <p>Thread Found: {details.thread_found || "Clean"}</p>
                <p>Scan Result: {details.scan_result_i}</p>
                <p>DefTime: {details.def_time}</p>
              </div>
            ))}

          </div>
      ) : ( 
        
        <div className="scanResultNotFound">
          {dataID == null && additionalInformations == null && scanResults == null && (
            <div>
            <p>No results found!</p>
            <button className="buttonSanitizer" onClick={fileUploder}>Upload the file</button>  
            </div>
          )}

          {dataID != null && (
            
              <div>
              <p>Data ID created: {dataID}</p>
              <button className="buttonSanitizer" onClick={startPolling}>Poll to get a result </button>
              </div>
            
          )}
        </div>
      )}    

      <p className="noteText">*Note: I made the application using buttons to be able to visualize each step it takes.</p>
    </div>
  );
}

