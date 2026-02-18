import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonical
}) => {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Set or update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update meta tags
    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    if (title) {
      updateMetaTag('og:title', title, true);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
    }

    if (ogType) {
      updateMetaTag('og:type', ogType, true);
    }

    // Canonical URL
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute('href', canonical);
    }

    // Add structured data for better SEO
    const addStructuredData = () => {
      const scriptId = 'structured-data-org';
      let scriptElement = document.getElementById(scriptId);
      
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Jakub Minka",
        "description": description || "Profesionální fotograf a kameraman",
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "sameAs": [
          // These will be populated from settings
        ]
      };

      scriptElement.textContent = JSON.stringify(structuredData);
    };

    addStructuredData();

  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null;
};

export default SEO;
