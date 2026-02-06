'use client'

// Force dynamic rendering for this page since it uses searchParams
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import TopicSection from './components/topic_section'
import ScriptSection from './components/script_section'
import AssetSection from './components/asset_section'
import { useRouter, useSearchParams } from 'next/navigation'
import Drawer from './components/Drawer'
import NextImage from 'next/image';
import PendingUploadsTab from './components/PendingUploadsTab'
import UploadedVideosTab from './components/UploadedVideosTab'
import { v4 as uuidv4 } from 'uuid'
import NewsBanner from './components/NewsBanner'
import { useProcessing } from './components/ProcessingContext';


interface FormData {
  topic: string
  tone: 'Professional' | 'Casual' | 'Funny'
  genre: 'Educational' | 'Entertainment' | 'Tutorial'
  time: string
}


export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    tone: 'Professional',
    genre: 'Educational',
    time: '20',
  })
  const [script, setScript] = useState('')
  const [editedScript, setEditedScript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasScript, setHasScript] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoApproval, setVideoApproval] = useState<'approved' | 'rejected' | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [responseId, setResponseId] = useState<string | null>(null)
  const [responseTimestamp, setResponseTimestamp] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isProcessing, setIsProcessing] = useState(false) // Podcast tab local processing
  const [avatarIsProcessing, setAvatarIsProcessing] = useState(false); // Avatar tab local processing
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false)
  const [mediaGenerated, setMediaGenerated] = useState(false)
  const [generatedMedia, setGeneratedMedia] = useState<any>(null)
  const [regeneratingAsset, setRegeneratingAsset] = useState<{ type: 'images' | 'audio' | 'videos', index: number } | null>(null)
  const mediaRefs = useRef<(HTMLAudioElement | HTMLVideoElement)[]>([])
  const [isApprovingAssets, setIsApprovingAssets] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successProgress, setSuccessProgress] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [localImages, setLocalImages] = useState<any[]>([])
  const [localAudio, setLocalAudio] = useState<any[]>([])
  const [localVideos, setLocalVideos] = useState<any[]>([])
  const [localThumbnails, setLocalThumbnails] = useState<any[]>([])
  const [avatarFormData, setAvatarFormData] = useState<FormData>({
    topic: '',
    tone: 'Professional',
    genre: 'Educational',
    time: '1 minute',
  })
  const [avatarScript, setAvatarScript] = useState('');
  const [avatarEditedScript, setAvatarEditedScript] = useState('');
  const [avatarIsEditing, setAvatarIsEditing] = useState(false);
  const [avatarStatusMessage, setAvatarStatusMessage] = useState('');
  const [avatarFeedback, setAvatarFeedback] = useState('');
  const [avatarLoadingProgress, setAvatarLoadingProgress] = useState(0);
  const [avatarHasScript, setAvatarHasScript] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [avatarVideoApproval, setAvatarVideoApproval] = useState<'approved' | 'rejected' | null>(null);
  const [avatarApprovedVideoUrl, setAvatarApprovedVideoUrl] = useState<string | null>(null);
  const [avatarVideoDetails, setAvatarVideoDetails] = useState(null);
  const [bottomStatusMessage, setBottomStatusMessage] = useState('');
  const [proxyAvatarJobId, setProxyAvatarJobId] = useState<string | null>(null);
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') as 'new' | 'pending' | 'uploaded' | 'avatar' || 'new';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const highlightId = searchParams.get('highlight');
  const { isProcessing: globalProcessing, setIsProcessing: setGlobalProcessing, setMessage: setGlobalProcessingMessage, setProcessedTab } = useProcessing();

 
  const extractGoogleDriveFileId = (url: string) => {
    if (!url) return null;
   
    // Handle direct Google Drive "uc" URLs
    if (url.includes('drive.google.com/uc?id=')) {
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      return idMatch ? idMatch[1] : null;
    }
   
    // Handle Google Drive file URLs
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      return fileIdMatch ? fileIdMatch[1] : null;
    }
   
    // Handle other formats
    const fileIdMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    return fileIdMatch ? fileIdMatch[1] : null;
  };


  const getProxyUrl = (fileId: string, type: string) => {
    if (!fileId) return null;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/proxy/${fileId}`;
  };


  // Add a utility function to create a direct download link for Google Drive files
  const getDirectDownloadUrl = (fileId: string) => {
    if (!fileId || !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_DOWNLOAD_URL) return null;
    return `${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_DOWNLOAD_URL}&id=${fileId}`;
  };


  const handleRegenerateMedia = async (type: 'images' | 'audio' | 'videos', index: number, feedback?: string) => {
    setRegeneratingAsset({ type, index });
    const asset = generatedMedia[type][index];
   
    console.log('Current asset being regenerated:', {
      type,
      index,
      asset,
      originalUrl: asset.originalUrl,
      src: asset.src,
      name: asset.name,
      alt: asset.alt,
      fileId: asset.fileId
    });
   
    // Map the frontend asset type to backend expected type
    const getBackendType = (frontendType: string) => {
      switch (frontendType) {
        case 'images':
          return 'image';
        case 'videos':
          return 'video';
        case 'audio':
          return 'audio';
        default:
          return frontendType;
      }
    };


    const payload = {
      name: asset.name || asset.alt,
      type: getBackendType(type),
      originalUrl: asset.originalUrl || asset.src, // Include original URL if available
      fileId: asset.fileId, // Include file ID if available
      feedback: feedback || ''
    };
   
    console.log('Payload being sent to backend:', payload);


    try {
      // Show a loading state
      setRegeneratingAsset({ type, index });
     
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/media-regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });


      // Get the response text first for better error handling
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
     
      // Try to parse the response as JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server: ' + responseText);
      }


      if (!response.ok) {
        const errorMessage = data.error || 'Failed to regenerate media asset';
        const details = data.details ? `: ${data.details}` : '';
        throw new Error(errorMessage + details);
      }


      console.log('Response received from backend:', data);
     
      if (data && data.file) {
        console.log('New file data:', {
          url: data.file.url,
          name: data.file.name,
          type: data.file.type
        });
       
        const cacheBustedUrl = data.file.url + '?t=' + new Date().getTime();
        const newAsset = {
          ...asset,
          src: data.file.url ? getProxyUrl(data.file.url, type) + '?t=' + new Date().getTime() : cacheBustedUrl,
          originalUrl: data.file.url,
          directDownloadUrl: data.file.url ? getDirectDownloadUrl(data.file.url) : null,
          name: data.file.name,
          fileId: data.file.url ? extractGoogleDriveFileId(data.file.url) : null
        };
       
        if (type === 'images') {
          setGeneratedMedia((prevMedia: any) => {
            const newMedia = { ...prevMedia };
            newMedia.images = newMedia.images.map((item: any, i: number) =>
              i === index ? { ...newAsset, alt: data.file.name } : item
            );
            return newMedia;
          });
        } else if (type === 'audio') {
          setGeneratedMedia((prevMedia: any) => {
            const newMedia = { ...prevMedia };
            newMedia.audio = newMedia.audio.map((item: any, i: number) =>
              i === index ? newAsset : item
            );
            return newMedia;
          });
        } else if (type === 'videos') {
          setGeneratedMedia((prevMedia: any) => {
            const newMedia = { ...prevMedia };
            newMedia.videos = newMedia.videos.map((item: any, i: number) =>
              i === index ? newAsset : item
            );
            return newMedia;
          });
        } else if (type === 'thumbnails') {
          setGeneratedMedia((prevMedia: any) => {
            const newMedia = { ...prevMedia };
            newMedia.thumbnails = newMedia.thumbnails.map((item: any, i: number) =>
              i === index ? { ...newAsset, alt: data.file.name } : item
            );
            return newMedia;
          });
        }
        console.log('Updated media state:', generatedMedia);
      } else {
        console.warn('Regeneration response missing file data:', data);
        alert('Regeneration successful but new asset data is missing. Please check the console for details.');
      }


    } catch (error) {
      console.error('Error regenerating media asset:', error);
     
      // Show a more user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error regenerating media asset: ${errorMessage}. Please try again or check the console for details.`);
    } finally {
      setRegeneratingAsset(null);
    }
  };


  // Create a global play handler function that will be used for all media elements
  const handleMediaPlay = (event: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement>) => {
    // Get the current target that started playing
    const currentTarget = event.currentTarget;
   
    // Pause all other media elements
    mediaRefs.current.forEach(media => {
      if (media !== currentTarget && !media.paused) {
        media.pause();
      }
    });
  };
 
  // Clear mediaRefs when component unmounts or when media is regenerated
  useEffect(() => {
    return () => {
      mediaRefs.current = [];
    };
  }, [mediaGenerated]);


  useEffect(() => {
    if (showSuccessMessage) {
      // Hide message after 3 seconds (1s delay + 0.8s animation + 1.2s display time)
      const timeout = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);


      return () => clearTimeout(timeout);
    }
  }, [showSuccessMessage]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsProcessing(true) // local
    setGlobalProcessing(true) // global (for toast)
    setGlobalProcessingMessage('Generating your script...')
    console.log('[handleSubmit] Setting processedTab to "new"');
    setProcessedTab('new')
    setHasScript(false)
    try {
      // Generate unique ID and timestamp for initial submission (if needed)
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      const timestamp = new Date().toISOString()
      const payload = {
        ...formData,
        id,
        timestamp,
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE}/frontend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log("Fetch response:", response);
      console.log("Fetch response status:", response.status);
      if (!response.ok) throw new Error('Failed to generate script')
      const data = await response.json()
      setScript(data.content?.text || data.text || "")
      setEditedScript(data.content?.text || data.text || "")
      setVideoUrl(data.videoUrl)
      setHasScript(true)
      setResponseId(data.responseId || null)
      setResponseTimestamp(data.timestamp || null)
    } catch (error) {
      alert('Error generating script. Please try again.')
    } finally {
      setIsLoading(false)
      setIsProcessing(false) // local
      setGlobalProcessing(false) // global
    }
  }


  const handleSaveEdit = () => {
    setScript(editedScript)
    setIsEditing(false)
    setStatusMessage('Script updated successfully!')
    setTimeout(() => setStatusMessage(''), 2000)
  }


  const handleApproveOrRefineScript = async () => {
    try {
      setGlobalProcessing(true)
      setGlobalProcessingMessage('Processing your script...')
      console.log('[handleApproveOrRefineScript] Setting processedTab to "new"');
      setProcessedTab('new')
      setLoadingProgress(0)
      const status = feedback.trim() ? 'refine' : 'approved';
      const payload = {
        responseId,
        content: { text: editedScript },
        topic: formData.topic,
        tone: formData.tone,
        genre: formData.genre,
        feedback,
        status,
        timestamp: responseTimestamp,
      };


      let response;
      if (status === 'refine') {
        const refinePayload = {
          script: editedScript,
          feedback,
          topic: formData.topic,
          tone: formData.tone,
          genre: formData.genre,
          responseId,
          timestamp: responseTimestamp,
        };
        console.log('Refine Script payload being sent to backend:', refinePayload);
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/refine-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(refinePayload),
        });
      } else {
        setIsGeneratingMedia(true);
        response = await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setLoadingProgress(30)
      if (!response.ok) throw new Error(status === 'refine' ? 'Failed to refine script' : 'Failed to approve script');
     
      const data = await response.json();
     
      if (!data) {
        console.error("Backend response data is null or undefined.");
        alert('Error processing script: Received empty or invalid response from backend.');
        setGlobalProcessing(false);
        setIsGeneratingMedia(false);
        return;
      }


      console.log('Backend response data received by frontend:', data);
      console.log('Stringified backend data:', JSON.stringify(data, null, 2));


      if (status === 'refine') {
        const newScript = data.content?.text || data.text || '';
        setScript(newScript);
        setEditedScript(newScript);
        setFeedback('');
        setStatusMessage('Refined script updated!');
        setTimeout(() => setStatusMessage(''), 2000);
      } else {
        try {
          setLoadingProgress(50)
          // Parse the response data which might be in different formats
          console.log("Processing media data...");
          let responseFiles = [];
         
          // Check for "object Object" key structure (from the stringified object)
          if (data && data["object Object"] && data["object Object"].files) {
            console.log("Found files in 'object Object' key");
            responseFiles = data["object Object"].files;
          }
          // Check if it's a direct object with files property
          else if (data && data.files && Array.isArray(data.files)) {
            console.log("Found direct files array");
            responseFiles = data.files;
          }
          // Check if it's an array with files in the first element
          else if (Array.isArray(data) && data.length > 0) {
            if (data[0].files && Array.isArray(data[0].files)) {
              console.log("Found files array in first element");
              responseFiles = data[0].files;
            } else {
              console.log("Data is an array but doesn't contain files in expected format");
              responseFiles = data; // Use the array directly if it might be the files
            }
          }
          // Last resort - try to parse if it's a stringified JSON
          else if (typeof data === 'string') {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.files) {
                console.log("Parsed string data to get files");
                responseFiles = parsedData.files;
              }
            } catch (e) {
              console.error("Failed to parse string data:", e);
            }
          }
         
          console.log("Files found:", responseFiles.length);
          console.log("Sample file:", responseFiles[0]);


          const newGeneratedMedia = {
            images: responseFiles.filter((file: any) => file && file.type === 'image').map((file: any) => {
              const fileId = extractGoogleDriveFileId(file.url);
              const srcUrl = fileId ? getProxyUrl(fileId, 'image') : file.url;
              return {
                src: srcUrl,
                originalUrl: file.url,
                fileId: fileId,
                directDownloadUrl: fileId ? getDirectDownloadUrl(fileId) : null,
                alt: file.name,
                name: file.name,
                liked: false
              };
            }),
            thumbnails: responseFiles.filter((file: any) => file && file.type === 'thumbnail').map((file: any) => {
              const fileId = extractGoogleDriveFileId(file.url);
              const srcUrl = fileId ? getProxyUrl(fileId, 'image') : file.url;
              return {
                src: srcUrl,
                originalUrl: file.url,
                fileId: fileId,
                directDownloadUrl: fileId ? getDirectDownloadUrl(fileId) : null,
                alt: file.name,
                name: file.name,
                liked: false
              };
            }),
            audio: responseFiles.filter((file: any) => file && file.type === 'music').map((file: any) => {
              const fileId = extractGoogleDriveFileId(file.url);
              const srcUrl = fileId ? getProxyUrl(fileId, 'audio') : file.url;
              return {
                src: srcUrl,
                originalUrl: file.url,
                fileId: fileId,
                directDownloadUrl: fileId ? getDirectDownloadUrl(fileId) : null,
                name: file.name,
                liked: false
              };
            }),
            videos: responseFiles.filter((file: any) => file && file.type === 'visual').map((file: any) => {
              const fileId = extractGoogleDriveFileId(file.url);
              const srcUrl = fileId ? getProxyUrl(fileId, 'video') : file.url;
              return {
                src: srcUrl,
                originalUrl: file.url,
                fileId: fileId,
                directDownloadUrl: fileId ? getDirectDownloadUrl(fileId) : null,
                name: file.name,
                liked: false
              };
            })
          };
         
          console.log("Generated media object:", {
            images: newGeneratedMedia.images.length,
            audio: newGeneratedMedia.audio.length,
            videos: newGeneratedMedia.videos.length
          });


          // Set the media data
          setGeneratedMedia(newGeneratedMedia);
          setMediaGenerated(true);
          setIsGeneratingMedia(false);
          setLoadingProgress(0);


          // Create a promise for each media asset to load
          const loadPromises = [
            ...newGeneratedMedia.images.map((img, index, array) => new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                const progress = 50 + ((index + 1) / array.length) * 16.67; // 16.67 is roughly 50/3 to split remaining 50% among 3 types
                setLoadingProgress(progress);
                resolve(true);
              };
              image.onerror = reject;
              image.src = img.src;
            })),
            ...newGeneratedMedia.audio.map((audio, index, array) => new Promise((resolve) => {
              const audioEl = new Audio();
              audioEl.onloadeddata = () => {
                const progress = 66.67 + ((index + 1) / array.length) * 16.67;
                setLoadingProgress(progress);
                resolve(true);
              };
              audioEl.onerror = () => resolve(false);
              audioEl.src = audio.src;
            })),
            ...newGeneratedMedia.videos.map((video, index, array) => new Promise((resolve) => {
              const videoEl = document.createElement('video');
              videoEl.onloadeddata = () => {
                const progress = 83.34 + ((index + 1) / array.length) * 16.66;
                setLoadingProgress(progress);
                resolve(true);
              };
              videoEl.onerror = () => resolve(false);
              videoEl.src = video.src;
            }))
          ];

          // Load assets in the background, update progress bar, but don't block UI
          Promise.allSettled(loadPromises).then(() => {
            setLoadingProgress(100);
          });


        } catch (mediaError) {
          console.error('Media processing error:', mediaError);
          alert('Error processing media assets. Please try again.');
        } finally {
          setLoadingProgress(0);
        }
      }
    } catch (error) {
      console.error('Error processing script:', error);
      alert('Error processing script. Please try again.');
      setIsGeneratingMedia(false);
      setLoadingProgress(0);
    } finally {
      setGlobalProcessing(false)
    }
  }


  const handleLike = (type: 'images' | 'audio' | 'videos', index: number) => {
    setGeneratedMedia((prevMedia: any) => {
      const newMedia = { ...prevMedia };
      newMedia[type] = newMedia[type].map((item: any, i: number) =>
        i === index ? { ...item, liked: !item.liked } : item
      );
      return newMedia;
    });
  };


  const handleDownloadScript = () => {
    if (script) {
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube_script.txt'; // Default filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  const handleApproveAssets = async () => {
    if (!generatedMedia || !script) {
      alert('No media assets or script to approve');
      return;
    }

    setIsApprovingAssets(true);
    setGlobalProcessing(true);
    setProcessedTab('new');
    try {
      // Format the media data into a single array
      const allImages = [
        ...(generatedMedia.images?.map((img: any) => ({ ...img, type: 'image', status: img.status || 'approved' })) || []),
        ...(localImages.map((img: any) => ({ ...img, type: 'image', status: 'approved' })) || [])
      ];
      const allAudio = [
        ...(generatedMedia.audio?.map((audio: any) => ({ ...audio, type: 'music', status: audio.status || 'approved' })) || []),
        ...(localAudio.map((audio: any, index: number) => ({
          ...audio,
          type: 'music',
          url: audio.src.split(',')[1] || audio.src,
          id: index + 1,
          totalItems: localAudio.length,
          name: audio.name,
          mimeType: audio.mimeType
        })) || []),
      ];
      const allVideos = [
        ...(generatedMedia.videos?.map((video: any) => ({ ...video, type: 'visual', status: video.status || 'approved' })) || []),
        ...(localVideos.map((video: any, index: number) => ({
          ...video,
          type: 'visual',
          url: video.src.split(',')[1] || video.src,
          id: index + 1,
          totalItems: localVideos.length,
          name: video.name,
          mimeType: video.mimeType
        })) || [])
      ];
      const allThumbnails = [
        ...(generatedMedia.thumbnails?.map((thumb: any) => ({ ...thumb, type: 'thumbnail', status: thumb.status || 'approved' })) || []),
        ...(localThumbnails.map((thumb: any) => ({ ...thumb, type: 'thumbnail', status: 'approved' })) || [])
      ];
      const allMedia = [...allImages, ...allAudio, ...allVideos, ...allThumbnails];
      const totalItems = allMedia.length;


      // Build Uploaded_media array from all manually uploaded media
      const uploadedMedia = [
        ...localImages.map((img: any, index: number) => ({
          ...img,
          type: 'image',
          url: img.driveLink || img.src,
          proxyUrl: img.src,
          id: index + 1,
          totalItems: localImages.length
        })),
        ...localAudio.map((audio: any, index: number) => ({
          ...audio,
          type: 'music',
          url: audio.driveLink || audio.src,
          proxyUrl: audio.src,
          id: index + 1,
          totalItems: localAudio.length,
          name: audio.name,
          mimeType: audio.mimeType
        })),
        ...localVideos.map((video: any, index: number) => ({
          ...video,
          type: 'visual',
          url: video.driveLink || video.src,
          proxyUrl: video.src,
          id: index + 1,
          totalItems: localVideos.length,
          name: video.name,
          mimeType: video.mimeType
        })),
        ...localThumbnails.map((thumb: any, index: number) => ({
          ...thumb,
          type: 'thumbnail',
          url: thumb.driveLink || thumb.src,
          proxyUrl: thumb.src,
          id: index + 1,
          totalItems: localThumbnails.length
        })),
      ];


      // Build main media array for only generated media
      const generatedMediaArray = allMedia
        .filter((item: any) => !item.isBase64)
        .map((item: any, index: number) => ({
          id: index + 1,
          type: item.type,
          description: item.name || item.alt || `${item.type} content`,
          status: item.status,
          url: item.originalUrl || item.src,
          totalItems: allMedia.length
        }));


      // Transform the media array into the expected format
      const payload = {
        content: script,
        media: generatedMediaArray,
        Uploaded_media: uploadedMedia,
        responseId,
        timestamp: responseTimestamp,
        status: 'approved',
        topic: formData.topic,
        tone: formData.tone,
        genre: formData.genre
      };


      // Log the final payload for verification
      console.log('Final payload structure:', JSON.stringify(payload, null, 2));


      console.log('Full payload being sent:', JSON.stringify(payload, null, 2));


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approve-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });


      // Log the raw response
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));


      const responseText = await response.text();
      console.log('Raw response text:', responseText);


      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server: ' + responseText);
      }


      if (!response.ok) {
        const errorMessage = data.error || 'Failed to approve assets';
        const details = data.details ? `: ${JSON.stringify(data.details)}` : '';
        throw new Error(errorMessage + details);
      }


      console.log('Assets approved successfully:', data);
      // If backend returns a path, redirect with it as a query param
      if (data.path) {
        router.push(`/success?driveLink=${encodeURIComponent(data.path)}`);
      } else {
        router.push('/success');
      }
    } catch (error) {
      console.error('Error approving assets:', error);
      alert(`Error approving assets: ${error.message}`);
    } finally {
      setIsApprovingAssets(false);
      setGlobalProcessing(false);
    }
  };


  async function handleAvatarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAvatarIsProcessing(true); // local
    setGlobalProcessing(true); // global (for toast)
    setGlobalProcessingMessage('Generating avatar video...');
    console.log('[handleAvatarSubmit] Setting processedTab to "avatar"');
    setProcessedTab('avatar');
    setAvatarHasScript(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE}/avatarscript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: avatarFormData.topic, tone: avatarFormData.tone, genre: avatarFormData.genre, time: avatarFormData.time }),
      });
      if (!res.ok) throw new Error('Failed to generate script');
      const data = await res.json();
      const scriptText = data.content?.text || data.text || JSON.stringify(data);
      setAvatarScript(scriptText);
      setAvatarEditedScript(scriptText);
      setAvatarHasScript(true);
      setAvatarStatusMessage('Script approved!');
      if (data && data.video && data.video.url) {
        setAvatarApprovedVideoUrl(data.video.url);
        setAvatarVideoDetails(data);
        setBottomStatusMessage('');
        setTimeout(() => setAvatarStatusMessage(''), 3000);
      } else {
        setAvatarApprovedVideoUrl(null);
        setAvatarStatusMessage('Error occurred while generating avatar video.');
        setBottomStatusMessage('');
      }
      if (!proxyAvatarJobId) {
        const newId = uuidv4();
        setProxyAvatarJobId(newId);
      }
    } catch (err) {
      setAvatarScript('Failed to generate script.');
      setAvatarEditedScript('Failed to generate script.');
      setAvatarHasScript(true);
    } finally {
      setAvatarIsProcessing(false); // local
      setGlobalProcessing(false); // global
    }
  }


  const avatarImages = [
    'https://files2.heygen.ai/avatar/v3/0233ba6aea01411ab07ddafbf97886f2_39260/preview_talk_2.webp',
    'https://files2.heygen.ai/avatar/v3/167f0f21269445be8eb3964aee62bbad_38050/preview_target.webp',
    'https://files2.heygen.ai/avatar/v3/732ab382194149198f3c29d85988890e_37740/preview_talk_4.webp',
    'https://files2.heygen.ai/avatar/v3/11af9745b4fb470bad72bf5496a12007_39550/preview_target.webp'
 
  ];
  const avatarNames = [
    'Amelia',
    'Leos',
    'milena',
    'Gerado',
  ];
  const avatarIds = [
    'Amelia_sitting_business_training_front',
    'Leos_sitting_office_front',
    'Milena_sitting_office_front',
    'Gerardo_standing_nightscene_front',
  ];
  const voiceIds = [
    'dc44cce2502749a389d12b9baf4a0e5f',
    'e0beae5b24a843b7a9ea021c1db975dd',
    'e235f6f5b29748959ca6d319c261bd47',
    '6e032ca64a1745a0b48036e64042b2fb',
  ];
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);


  // When a new script is generated or entering the page, reset video and status message
  useEffect(() => {
    setAvatarApprovedVideoUrl(null);
    setAvatarStatusMessage('');
  }, [avatarScript]); // or use avatarFormData.topic if that's the trigger for new script


  // Hide body scrollbar during loading overlay
  useEffect(() => {
    if (isLoading || isProcessing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading, isProcessing]);


  // Always restore body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);


  return (
    <div className="w-full min-h-screen px-2 sm:px-4">
      {/* Header with hamburger and logo */}
      <header className="bg-gray-800 shadow-md p-2 flex items-center justify-between fixed top-0 left-0 w-full z-50" style={{height: '90px'}}>
        {/* Hamburger icon - left */}
        <button
          className="md:hidden ml-0 bg-gray-800 p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Open navigation menu"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onClick={() => setMobileOpen(true)}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Centered logo - absolutely centered */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <NextImage
            src="/Podnest_logo.svg"
            alt="Podnest Logo"
            width={130}
            height={70}
            style={{ display: 'block', objectFit: 'contain' }}
            priority
          />
        </div>
        {/* Empty right side for balance */}
        <div className="w-10 md:w-0" />
      </header>
      <div style={{paddingTop: '92px'}}>
        <Drawer
          defaultTab={defaultTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          newProject={
            mediaGenerated ? (
              <AssetSection
                generatedMedia={generatedMedia}
                regeneratingAsset={regeneratingAsset}
                isApprovingAssets={isApprovingAssets}
                showSuccessMessage={showSuccessMessage}
                mediaRefs={mediaRefs}
                handleRegenerateMedia={handleRegenerateMedia}
                handleMediaPlay={handleMediaPlay}
                handleApproveAssets={handleApproveAssets}
                setMediaGenerated={setMediaGenerated}
                localImages={localImages}
                setLocalImages={setLocalImages}
                localAudio={localAudio}
                setLocalAudio={setLocalAudio}
                localVideos={localVideos}
                setLocalVideos={setLocalVideos}
                localThumbnails={localThumbnails}
                setLocalThumbnails={setLocalThumbnails}
              />
            ) : !hasScript ? (
              (isLoading || isProcessing) ? (
                <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                  <svg className="animate-spin h-14 w-14 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">Generating your script...</h2>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
                    <div className="bg-red-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${loadingProgress || 30}%` }}></div>
                  </div>
                  <div className="w-full flex flex-col items-center mb-2 mt-8">
                    <h3 className="text-lg font-bold text-red-400 mb-1 text-center">Latest Tech News</h3>
                    <p className="text-gray-300 text-xs text-center">We're generating your script. Here's some tech news to keep you updated!</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl shadow-lg p-4 w-full max-w-full max-h-[350px] overflow-y-auto flex flex-col items-center">
                    <div className="w-full">
                      <NewsBanner topic={formData.topic || 'AI'} />
                    </div>
                  </div>
                </div>
              ) : (
                <TopicSection
                  formData={formData}
                  setFormData={setFormData}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              )
            ) : (
              <ScriptSection
                formData={formData}
                script={script}
                editedScript={editedScript}
                setEditedScript={setEditedScript}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                statusMessage={statusMessage}
                videoUrl={videoUrl}
                feedback={feedback}
                setFeedback={setFeedback}
                isProcessing={isProcessing}
                isGeneratingMedia={isGeneratingMedia}
                loadingProgress={loadingProgress}
                handleSaveEdit={handleSaveEdit}
                handleDownloadScript={handleDownloadScript}
                handleApproveOrRefineScript={handleApproveOrRefineScript}
                setHasScript={setHasScript}
                setScript={setScript}
                setVideoUrl={setVideoUrl}
                setVideoApproval={setVideoApproval}
                setMediaGenerated={setMediaGenerated}
              />
            )
          }
          createAvatarVideo={
            avatarHasScript ? (
              <div className="flex flex-col items-center w-full">
                <ScriptSection
                  formData={avatarFormData}
                  script={avatarScript}
                  editedScript={avatarEditedScript}
                  setEditedScript={setAvatarEditedScript}
                  isEditing={avatarIsEditing}
                  setIsEditing={setAvatarIsEditing}
                  statusMessage={avatarStatusMessage}
                  videoUrl={avatarVideoUrl}
                  feedback={avatarFeedback}
                  setFeedback={setAvatarFeedback}
                  isProcessing={globalProcessing}
                  isGeneratingMedia={isGeneratingMedia}
                  loadingProgress={avatarLoadingProgress}
                  handleSaveEdit={() => {
                    setAvatarScript(avatarEditedScript);
                    setAvatarIsEditing(false);
                    setAvatarStatusMessage('Script updated successfully!');
                    setTimeout(() => setAvatarStatusMessage(''), 2000);
                  }}
                  handleDownloadScript={() => {
                    // Download logic for avatar script
                    const blob = new Blob([avatarScript], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'avatar_script.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  handleApproveOrRefineScript={async () => {
                    if (avatarFeedback.trim()) {
                      // REFINEMENT LOGIC: Only send script and feedback for refinement
                      setGlobalProcessing(true);
                      const refinePayload = {
                        script: avatarEditedScript,
                        feedback: avatarFeedback,
                        topic: avatarFormData.topic,
                        tone: avatarFormData.tone,
                        genre: avatarFormData.genre,
                        responseId: null, // or appropriate value
                        timestamp: new Date().toISOString(),
                      };
                      console.log('Refine Script payload being sent to backend:', refinePayload);
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/refine-script`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(refinePayload),
                        });
                        const data = await res.json();
                        if (res.ok && (data.content?.text || data.text)) {
                          const newScript = data.content?.text || data.text;
                          setAvatarScript(newScript);
                          setAvatarEditedScript(newScript);
                          setAvatarFeedback('');
                          setAvatarStatusMessage('Refined script updated!');
                          setTimeout(() => setAvatarStatusMessage(''), 2000);
                        } else {
                          setAvatarStatusMessage('Failed to refine script.');
                        }
                      } catch (err) {
                        setAvatarStatusMessage('Error refining script.');
                      } finally {
                        setGlobalProcessing(false);
                      }
                      return;
                    }
                    // APPROVAL LOGIC: Only run this if feedback is empty
                    setGlobalProcessing(true);
                    setProcessedTab('avatar'); // <-- Ensure this is called
                    console.log('Approve Script clicked: starting avatar video generation');
                    // Send topic, avatarId, and script to backend proxy
                    try {
                      console.log('Sending POST to /api/proxy-avatar with:', {
                        topic: avatarFormData.topic,
                        avatarId: selectedAvatarId,
                        script: avatarScript,
                        voiceId: selectedVoiceId,
                      });
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/proxy-avatar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          topic: avatarFormData.topic,
                          avatarId: selectedAvatarId,
                          script: avatarScript,
                          voiceId: selectedVoiceId,
                        }),
                      });
                      console.log('Received response from backend (raw):', res);
                      let data;
                      try {
                        data = await res.clone().json();
                        console.log('Response JSON from backend:', data);
                      } catch (jsonErr) {
                        console.error('Error parsing JSON from backend:', jsonErr);
                        data = null;
                      }
                      if (res.ok && data && data.video && data.video.url) {
                        setAvatarApprovedVideoUrl(data.video.url);
                        setAvatarVideoDetails(data);
                        setAvatarStatusMessage('Script approved!');
                        setBottomStatusMessage('');
                        setTimeout(() => setAvatarStatusMessage(''), 3000);
                      } else {
                        setAvatarApprovedVideoUrl(null);
                        setAvatarStatusMessage('Error occurred while generating avatar video.');
                        setBottomStatusMessage('');
                      }
                    } catch (err) {
                      console.error('Error during avatar video generation:', err);
                      setAvatarStatusMessage('Failed to generate avatar video.');
                    } finally {
                      setGlobalProcessing(false);
                      console.log('Avatar video generation process finished.');
                    }
                  }}
                  setHasScript={setAvatarHasScript}
                  setScript={setAvatarScript}
                  setVideoUrl={setAvatarVideoUrl}
                  setVideoApproval={setAvatarVideoApproval}
                  setMediaGenerated={() => {}}
                  approveDisabled={!avatarFeedback.trim() && !selectedAvatar}
                />
                {/* Avatar selection section */}
                <div className="w-full max-w-4xl mt-8 flex flex-col items-center">
                  <h3 className="text-xl font-bold text-white mb-4">Select an Avatar</h3>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 justify-center w-full">
                    {avatarImages.map((src, idx) => (
                      <div key={src} className="flex flex-col items-center mb-4">
                        <button
                          className={`rounded-full border-4 transition-all duration-200 ${selectedAvatar === src ? 'border-red-500 scale-110' : 'border-transparent'} focus:outline-none`}
                          onClick={() => { setSelectedAvatar(src); setSelectedAvatarId(avatarIds[idx]); setSelectedVoiceId(voiceIds[idx]); }}
                        >
                          <img src={src} alt={avatarNames[idx]} className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover" />
                        </button>
                        <span className="mt-2 text-white font-medium text-base sm:text-lg text-center break-words max-w-[6rem] sm:max-w-[7rem] md:max-w-[8rem]">{avatarNames[idx]}</span>
                      </div>
                    ))}
                  </div>
                  {!selectedAvatar && <p className="text-red-400 mt-4">Please select an avatar to approve the script.</p>}
                </div>
                {/* Video player after approval */}
                {avatarApprovedVideoUrl && (
                  <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-4">Generated Avatar Video</h3>
                    <video src={avatarApprovedVideoUrl} controls className="w-full rounded-lg bg-black" />
                    <div className="flex flex-row gap-4 mt-4">
                      <button
                        className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                        onClick={async () => {
                          try {
                            const payload = {
                              file: avatarVideoDetails?.file,
                              video: avatarVideoDetails?.video,
                              drive: avatarVideoDetails?.drivefolder,
                              status: 'pending',
                              topic: avatarFormData.topic,
                              script: avatarScript,
                              title: avatarVideoDetails?.title,
                              avatarId: selectedAvatarId,
                              voiceId: selectedVoiceId,
                              jobId: proxyAvatarJobId
                            };
                            console.log('Saving avatar video details:', payload);
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/proxy-avatar/save`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            });
                            if (res.ok) {
                              setBottomStatusMessage('Project saved to Pending Uploads');
                              // Use window.location for a full page reload and redirect
                              window.location.href = '/?tab=pending';
                            } else {
                              setBottomStatusMessage('Failed to save Project.');
                            }
                          } catch (err) {
                            setBottomStatusMessage('Error saving Project.');
                          }
                        }}
                      >
                        Save to pending
                      </button>
                      <button
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        onClick={async () => {
                          try {
                            const payload = {
                              file: avatarVideoDetails?.file,
                              video: avatarVideoDetails?.video,
                              drive: avatarVideoDetails?.drivefolder,
                              status: 'upload',
                              topic: avatarFormData.topic,
                              script: avatarScript,
                              title: avatarVideoDetails?.title,
                              avatarId: selectedAvatarId,
                              voiceId: selectedVoiceId,
                              jobId: proxyAvatarJobId
                            };
                            console.log('Saving avatar video details:', payload);
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/proxy-avatar/upload`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            });
                            const data = await res.json();
                            console.log('Response from /api/proxy-avatar/upload:', data);
                            // Optionally, you could send a follow-up request to save youtubelink/title if needed
                            if (res.ok) {
                              setBottomStatusMessage('Video published');

                              window.location.href = '/?tab=uploaded';
                            } else {
                              setBottomStatusMessage('Failed to publish video.');
                            }
                          } catch (err) {
                            setBottomStatusMessage('Error saving Project.');
                          }
                        }}
                      >
                        Upload to YouTube
                      </button>
                    </div>
                  </div>
                )}
                {bottomStatusMessage && (
                  <div className="text-green-400 mt-4">{bottomStatusMessage}</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <TopicSection
                  formData={avatarFormData}
                  setFormData={setAvatarFormData}
                  handleSubmit={handleAvatarSubmit}
                  isLoading={avatarIsProcessing}
                  title="Create Avatar Video"
                />
              </div>
            )
          }
          pendingUploads={<PendingUploadsTab />}
          uploadedVideos={<UploadedVideosTab />}
        />
      </div>
    </div>
  );
}

