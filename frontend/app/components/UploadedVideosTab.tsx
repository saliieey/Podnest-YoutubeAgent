import React, { useEffect, useState } from 'react';

interface UploadedProject {
  _id: string;
  topic: string;
  timestamp?: string;
  content?: string;
  status: string;
  driveLink?: string;
  youtubeLink?: string;
  title?: string;
  embedding?: string;
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
  youtubelink?: string;
  embedding?: string;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  // Match youtu.be or youtube.com/watch?v= links
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
};

// Helper to extract src from iframe HTML or return direct URL
function getEmbedSrc(embedding?: string) {
  if (!embedding) return undefined;
  const match = embedding.match(/src=["']([^"']+)["']/);
  let src = match ? match[1] : embedding;
  // If src starts with //, prepend https:
  if (src.startsWith('//')) {
    src = 'https:' + src;
  }
  console.log('Embedding src:', src); // Debug output
  return src;
}

export default function UploadedVideosTab() {
  const [uploadedProjects, setUploadedProjects] = useState<UploadedProject[]>([]);
  const [proxyAvatarUploads, setProxyAvatarUploads] = useState<ProxyAvatarUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip API call if base URL is not configured (during build)
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      setLoading(false);
      setError('API base URL not configured');
      return;
    }
    
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/uploaded-projects`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch uploaded projects');
        return res.json();
      })
      .then(data => {
        setUploadedProjects(data.scriptHistories || []);
        setProxyAvatarUploads(data.proxyAvatarUploads || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-full sm:max-w-2xl md:max-w-4xl bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-700 flex flex-col items-center min-h-[400px]">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">Uploaded Videos</h2>
      <p className="text-gray-300 mb-6 sm:mb-8 text-center">Your videos that have been uploaded to YouTube</p>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (uploadedProjects.length === 0 && proxyAvatarUploads.length === 0) ? (
        <div className="flex flex-col items-center justify-center w-full py-12 sm:py-16">
          {/* Video logo SVG instead of YouTube logo */}
          <svg className="w-16 h-16 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
          <p className="text-gray-400 text-lg font-semibold">No uploaded videos.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 sm:gap-6">
          {/* Render ProxyAvatarUploads first */}
          {proxyAvatarUploads.map(upload => (
            <div key={upload._id} className="flex flex-col md:flex-row items-center bg-gray-700 rounded-lg p-4 sm:p-6 mb-2 shadow border border-gray-600">
              {/* Video Preview (Embedding, Drive, or direct video) */}
              <div className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:w-64 aspect-video bg-gray-600 rounded-md mr-0 md:mr-8 mb-4 md:mb-0 relative">
                {upload.embedding ? (
                  <iframe
                    src={getEmbedSrc(upload.embedding)}
                    title="AI Avatar video preview"
                    className="w-full h-full rounded-md bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : upload.drive && upload.drive.url ? (
                  <a href={upload.drive.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center text-white underline">
                    View Drive Video
                  </a>
                ) : upload.video && upload.video.url ? (
                  <video src={upload.video.url} controls className="w-full h-full rounded-md object-contain bg-black" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No video preview</div>
                )}
              </div>
              {/* Project Info */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold text-white mb-1 break-words">
                    {upload.title || upload.topic}
                  </div>
                  {upload.avatarId && (
                    <div className="mb-2">
                      <span className="inline-block text-grey-600 text-xs rounded py-0.5 shadow-sm">
                        🧑‍💻 AI-Avatar Project
                      </span>
                    </div>
                  )}
                  <div className="text-gray-400 text-xs sm:text-sm mb-2">{upload.createdAt ? new Date(upload.createdAt).toLocaleString() : ''}</div>
                  <div className="text-gray-300 mb-2">Status: <span className="text-grey-300">Uploaded</span></div>
                  {upload.youtubelink && (
                    <a href={upload.youtubelink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-xs sm:text-sm">View YouTube Video</a>
                  )}
                  {upload.drive && upload.drive.url && (
                    <a href={upload.drive.url} target="_blank" rel="noopener noreferrer" className="text-red-400 underline text-xs sm:text-sm ml-2 sm:ml-4">View Drive Link</a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Render ScriptHistory uploaded projects */}
          {uploadedProjects.map(project => (
            <div key={project._id} className="flex flex-col md:flex-row items-center bg-gray-700 rounded-lg p-4 sm:p-6 mb-2 shadow border border-gray-600">
              {/* Video Preview (Embedding, YouTube, or Drive) */}
              <div className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:w-64 aspect-video bg-gray-600 rounded-md mr-0 md:mr-8 mb-4 md:mb-0 relative">
                {project.embedding ? (
                  <iframe
                    src={getEmbedSrc(project.embedding)}
                    title="YouTube video preview"
                    className="w-full h-full rounded-md bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : project.youtubeLink ? (
                  <iframe
                    src={getYouTubeEmbedUrl(project.youtubeLink)}
                    title="YouTube video preview"
                    className="w-full h-full rounded-md bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : project.driveLink ? (
                  <a href={project.driveLink} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center text-white underline">
                    View Drive Video
                  </a>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No video preview</div>
                )}
              </div>
              {/* Project Info */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div className="min-w-0">
                  <div className="text-grey-300 mb-2 break-words">{project.title}</div>
                  <div className="text-gray-400 text-xs sm:text-sm mb-2">{project.timestamp ? new Date(project.timestamp).toLocaleString() : ''}</div>
                  <div className="text-gray-300 mb-2">Status: <span className="text-grey-300">Uploaded</span></div>
                  {project.youtubeLink && (
                    <a href={project.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-xs sm:text-sm">View YouTube Video</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 