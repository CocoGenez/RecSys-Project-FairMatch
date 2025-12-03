const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8001';

export async function uploadResume(formData: FormData) {
  const response = await fetch(`${API_URL}/api/parse-resume`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload resume');
  }
  
  return response.json();
}

export async function getRecommendations(userId: number) {
  const response = await fetch(`${API_URL}/recommend/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  
  return response.json();
}

export async function saveInteraction(interaction: {
  user_id: number;
  item_id: string;
  type: string;
  action: string;
  timestamp: string;
}) {
  const response = await fetch(`${API_URL}/api/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(interaction),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save interaction');
  }
  
  return response.json();
}

export async function getLikedJobs(userId: number) {
  const response = await fetch(`${API_URL}/api/liked-jobs/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch liked jobs');
  }
  
  return response.json();
}
