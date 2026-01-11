interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-gray-900">About This Project</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-gray-700">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg border-4 border-white">
              <img 
                src="/images/IMG_0277.jpg" 
                alt="Advay Tripathi"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image not found
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                <span className="text-white text-5xl font-bold">AT</span>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-2">👤 About Me</h3>
            <p className="leading-relaxed">
              Hi, my name is <strong>Advay Tripathi</strong>. I'm a 6th-grade student who is passionate about using technology to solve real-world problems. 
              Academically, I enjoy solving math problems and never get tired of doing them. I also love learning about history and reading books. 
              Outside of academics, I enjoy building with LEGOs and playing sports. I love to play baseball. My position in baseball is pitcher and have been playing for four years. 
              Other sports I enjoy playing with my friends include basketball and football.
            </p>
          </div>

          {/* Project Goals */}
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-2">🚀 Project Goals</h3>
            <p className="leading-relaxed">
              My goal is to deploy this tool to rural health clinics where workers lack expensive diagnostic equipment 
              and reliable internet. I want to help screen patients for early signs of dementia and memory impairment in 
              underserved communities, proving that accessible web technology can close healthcare gaps just as effectively 
              as costly native apps.
            </p>
          </div>

          {/* Technical Highlights */}
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-2">🛠️ Technical Highlights</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>WCAG 2.1 AA Accessible:</strong> 92/100 score with large touch targets, keyboard navigation, and screen reader support</li>
              <li><strong>15 Languages:</strong> English, Chinese, Hindi, Spanish, French, Arabic, Bengali, Portuguese, Russian, Japanese, German, Swahili, Hausa, Amharic, and Yoruba</li>
              <li><strong>Works on Cheap Phones:</strong> Optimized for $50-100 Android devices with limited resources</li>
              <li><strong>Offline-Ready:</strong> Progressive Web App that works without internet connection</li>
              <li><strong>Audio-Based Testing:</strong> Cognitive assessment through number sequence recall</li>
            </ul>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className="font-semibold text-xl text-gray-900 mb-2">📧 Get In Touch</h3>
            <div className="space-y-1">
              <p><strong>GitHub:</strong> <a href="https://github.com/advay4ever" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@advay4ever</a></p>
              <p><strong>Project:</strong> <a href="https://github.com/advay4ever/memory-match-mobile" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">memory-match-mobile</a></p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
