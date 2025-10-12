export const decodeToken = encodedToken => {
  try {
    // Base64URL → Base64
    const base64 = encodedToken
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedToken.length / 4) * 4, '=');

    // Decode UTF-8-safe string
    const decoded = atob(base64);
    return decodeURIComponent([...decoded].map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
  } catch (error) {
    return null;
  }
};

export const encodeToken = (token) => btoa(token);
