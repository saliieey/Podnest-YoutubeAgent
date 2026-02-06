import React, { useEffect, useState, useRef } from 'react';
import { useProcessing } from './ProcessingContext';

interface PendingProject {
  _id: string;
  topic: string;
  timestamp?: string;
  content?: string;
  status: string;
  driveLink?: string;
}

interface ProxyAvatarUpload {
  _id: string;
  topic: string;
  script?: string;
  title?: string;
  drive?: { url?: string };
  file?: { url?: string };
  video?: { url?: string };
  avatarId?: string;
  voiceId?: string;
  status: string;
  jobId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PendingUploadsTab() {
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [proxyAvatarUploads, setProxyAvatarUploads] = useState<ProxyAvatarUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store uploaded video URLs by project ID
  const [uploadedVideos, setUploadedVideos] = useState<{ [projectId: string]: string }>({});
  // Store uploaded video files by project ID
  const [uploadedVideoFiles, setUploadedVideoFiles] = useState<{ [projectId: string]: File }>({});
  const [uploading, setUploading] = useState<{ [projectId: string]: boolean }>({});
  const fileInputs = useRef<{ [projectId: string]: HTMLInputElement | null }>({});
  const { setIsProcessing, setMessage, setProcessedTab } = useProcessing();

  useEffect(() => {
    // Skip API call if base URL is not configured (during build)
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      setLoading(false);
      setError('API base URL not configured');
      return;
    }
    
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pending-projects`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch pending projects');
        return res.json();
      })
      .then(data => {
        setPendingProjects(data.scriptHistories || []);
        setProxyAvatarUploads(data.proxyAvatarUploads || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleUploadClick = (projectId: string) => {
    if (fileInputs.current[projectId]) {
      fileInputs.current[projectId]!.click();
    }
  };

  const handleFileChange = (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideos(prev => ({ ...prev, [projectId]: url }));
      setUploadedVideoFiles(prev => ({ ...prev, [projectId]: file }));
    }
  };

  const handleUploadNow = async (projectId: string, videoUrlFromDb?: string) => {
    setIsProcessing(true);
    setMessage('Uploading to YouTube...');
    setProcessedTab('pending');
    let file = uploadedVideoFiles[projectId];
    const proxyUpload = proxyAvatarUploads.find(p => p._id === projectId);
    if (!file && proxyUpload) {
      // No new file selected, use proxy-avatar upload flow
      setUploading(prev => ({ ...prev, [projectId]: true }));
      try {
        const payload = {
          file: proxyUpload.file,
          drive: proxyUpload.drive,
          status: 'upload',
          topic: proxyUpload.topic,
          script: proxyUpload.script,
          title: proxyUpload.title,
          video: proxyUpload.video,
          avatarId: proxyUpload.avatarId,
          voiceId: proxyUpload.voiceId,
          jobId: proxyUpload.jobId
        };
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/proxy-avatar/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error('Upload failed: ' + errorText);
        }
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pending-projects`)
          .then(res => res.json())
          .then(data => {
            setPendingProjects(data.scriptHistories || []);
            setProxyAvatarUploads(data.proxyAvatarUploads || []);
            setLoading(false);
          });
      } catch (err) {
        alert('Upload failed: ' + (err as Error).message);
      } finally {
        setUploading(prev => { const copy = { ...prev }; delete copy[projectId]; return copy; });
        setIsProcessing(false);
      }
      return;
    }
    // If a new file is selected, upload as before
    if (!file && videoUrlFromDb) {
      // Fetch the video from the DB URL and convert to File/Blob
      try {
        const response = await fetch(videoUrlFromDb);
        const blob = await response.blob();
        const extMatch = videoUrlFromDb.match(/\.([a-zA-Z0-9]+)(\?|$)/);
        const ext = extMatch ? extMatch[1] : 'mp4';
        file = new File([blob], `video.${ext}`, { type: blob.type || 'video/mp4' });
      } catch (err) {
        alert('Failed to fetch video from server. Please try changing the video.');
        return;
      }
    }
    if (!file) {
      console.log('No file selected for project:', projectId);
      return;
    }
    setUploading(prev => ({ ...prev, [projectId]: true }));
    const formData = new FormData();
    formData.append('video', file);
    formData.append('projectId', projectId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload-video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error('Upload failed: ' + errorText);
      }
      setUploadedVideos(prev => { const copy = { ...prev }; delete copy[projectId]; return copy; });
      setUploadedVideoFiles(prev => { const copy = { ...prev }; delete copy[projectId]; return copy; });
      setUploading(prev => { const copy = { ...prev }; delete copy[projectId]; return copy; });
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pending-projects`)
        .then(res => res.json())
        .then(data => {
          setPendingProjects(data.scriptHistories || []);
          setProxyAvatarUploads(data.proxyAvatarUploads || []);
          setLoading(false);
        });
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
      setUploading(prev => { const copy = { ...prev }; delete copy[projectId]; return copy; });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-2xl md:max-w-4xl bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-700 flex flex-col items-center min-h-[400px]">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">Pending Uploads</h2>
      <p className="text-gray-300 mb-6 sm:mb-8 text-center">Your videos that are waiting to be uploaded to YouTube</p>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (pendingProjects.length === 0 && proxyAvatarUploads.length === 0) ? (
        <div className="flex flex-col items-center justify-center w-full py-12 sm:py-16">
          <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" viewBox="0 0 48 48" width="64" height="48" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="32" height="28" rx="3" fill="#6B7280"/><path d="M8 15a3 3 0 0 1 3-3h7.172a3 3 0 0 1 2.121.879l2.828 2.828A3 3 0 0 0 25.243 16H40a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V15Z" fill="#9CA3AF"/></svg>
          <p className="text-gray-400 text-lg font-semibold">No pending projects to upload!</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 sm:gap-6">
          {/* Render ProxyAvatarUploads first */}
          {proxyAvatarUploads.map(upload => (
            <div key={upload._id} className="flex flex-col md:flex-row items-center bg-gray-700 rounded-lg p-4 sm:p-6 mb-2 shadow border border-gray-600">
              {/* Video Upload/Preview */}
              <div className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:w-64 aspect-video bg-gray-600 rounded-md mr-0 md:mr-8 mb-4 md:mb-0 relative">
                {uploadedVideos[upload._id] ? (
                  <>
                    <video src={uploadedVideos[upload._id]} controls className="w-full h-full rounded-md object-contain bg-black" />
                    <button
                      className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-90"
                      onClick={() => setUploadedVideos(prev => { const copy = { ...prev }; delete copy[upload._id]; return copy; })}
                      title="Remove video"
                    >
                      &times;
                    </button>
                  </>
                ) : upload.video && upload.video.url ? (
                  <>
                    <video src={upload.video.url} controls className="w-full h-full rounded-md object-contain bg-black" />
                    <button
                      className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400 text-sm"
                      onClick={() => handleUploadClick(upload._id)}
                    >
                      Change Video
                    </button>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      ref={el => { fileInputs.current[upload._id] = el; }}
                      onChange={e => handleFileChange(upload._id, e)}
                    />
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>
                    <button
                      className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400 text-sm"
                      onClick={() => handleUploadClick(upload._id)}
                    >
                      Click to upload
                    </button>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      ref={el => { fileInputs.current[upload._id] = el; }}
                      onChange={e => handleFileChange(upload._id, e)}
                    />
                  </>
                )}
              </div>
              {/* Info and Upload Button */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-white mb-2 break-words">{upload.title || upload.topic}</div>
                  <div className="text-gray-400 text-xs sm:text-sm mb-2">{upload.createdAt ? new Date(upload.createdAt).toLocaleString() : ''}</div>
                  <div className="text-gray-300 mb-2">Status: <span className="text-frey-300">Pending</span></div>
                  {upload.drive && upload.drive.url && (
                    <a href={upload.drive.url} target="_blank" rel="noopener noreferrer" className="text-red-400 underline text-xs sm:text-sm">View Drive Link</a>
                  )}
                </div>
                <button
                  className="mt-4 md:mt-0 md:ml-8 px-4 sm:px-6 py-2 bg-red-500 text-white rounded font-semibold text-sm sm:text-base hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading[upload._id]}
                  onClick={() => handleUploadNow(upload._id, upload.video && upload.video.url)}
                >
                  {uploading[upload._id] ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </div>
          ))}
          {/* Render ScriptHistory pending projects */}
          {pendingProjects.map(project => (
            <div key={project._id} className="flex flex-col md:flex-row items-center bg-gray-700 rounded-lg p-4 sm:p-6 mb-2 shadow border border-gray-600">
              {/* Video Upload/Preview */}
              <div className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:w-64 aspect-video bg-gray-600 rounded-md mr-0 md:mr-8 mb-4 md:mb-0 relative">
                {uploadedVideos[project._id] ? (
                  <>
                    <video src={uploadedVideos[project._id]} controls className="w-full h-full rounded-md object-contain bg-black" />
                    <button
                      className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-90"
                      onClick={() => setUploadedVideos(prev => { const copy = { ...prev }; delete copy[project._id]; return copy; })}
                      title="Remove video"
                    >
                      &times;
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>
                    <button
                      className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400 text-sm"
                      onClick={() => handleUploadClick(project._id)}
                    >
                      Click to upload
                    </button>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      ref={el => { fileInputs.current[project._id] = el; }}
                      onChange={e => handleFileChange(project._id, e)}
                    />
                  </>
                )}
              </div>
              {/* Project Info and Upload Button */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-white mb-2 break-words">{project.topic}</div>
                  <div className="text-gray-400 text-xs sm:text-sm mb-2">{project.timestamp ? new Date(project.timestamp).toLocaleString() : ''}</div>
                  <div className="text-gray-300 mb-2">Status: <span className="text-grey-300">Pending</span></div>
                  {project.driveLink && (
                    <a href={project.driveLink} target="_blank" rel="noopener noreferrer" className="text-red-400 underline text-xs sm:text-sm">View Drive Link</a>
                  )}
                </div>
                {uploadedVideos[project._id] && (
                  <button
                    className="mt-4 md:mt-0 md:ml-8 px-4 sm:px-6 py-2 bg-red-500 text-white rounded font-semibold text-sm sm:text-base hover:bg-red-600 transition-colors duration-200"
                    disabled={uploading[project._id]}
                    onClick={() => handleUploadNow(project._id)}
                  >
                    {uploading[project._id] ? 'Uploading...' : 'Upload Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 