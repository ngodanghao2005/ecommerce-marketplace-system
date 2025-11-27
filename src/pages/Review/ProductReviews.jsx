import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MoreHorizontal, ChevronDown, MessageSquare } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

// Import Review Service
import * as reviewService from '../../services/reviewService';

// Import Header/Footer
import Header from '../../components/header/Header';
import Footer from '../../components/footer/Footer';

const ProductReviews = () => {
  // Reaction Types Configuration
  const REACTION_TYPES = [
    { id: 'like', icon: '👍', label: 'Like', color: 'text-blue-600' },
    { id: 'love', icon: '❤️', label: 'Love', color: 'text-red-500' },
    { id: 'haha', icon: '😆', label: 'Haha', color: 'text-yellow-500' },
    { id: 'wow', icon: '😮', label: 'Wow', color: 'text-yellow-500' },
    { id: 'sad', icon: '😢', label: 'Sad', color: 'text-yellow-500' },
    { id: 'angry', icon: '😡', label: 'Angry', color: 'text-orange-600' }
  ];

  const { productId: pid } = useParams();
  const navigate = useNavigate();

  // State Management
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  // [NEW] State for Reply System
  const [replyInput, setReplyInput] = useState({}); // Stores text for each review: { reviewId: "text..." }
  const [activeReplyId, setActiveReplyId] = useState(null); // ID of the review currently being replied to

  // Load Data Effect
  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch Product List for Dropdown
      if (products.length === 0) {
        try {
          const allProducts = await reviewService.getAllProducts();
          if (allProducts && allProducts.length > 0) {
            setProducts(allProducts);
            // Auto-navigate to first product if no ID in URL
            if (!pid) {
                navigate(`/product/${allProducts[0].product_id}/reviews`);
                return; 
            }
          }
        } catch (err) {
          console.error('Failed to fetch products via ReviewService', err);
        }
      }

      // 2. Fetch Reviews for current product
      if (pid) {
        setLoading(true);
        setFetchError('');
        try {
          const list = await reviewService.getReviews(pid);
          
          // Normalize Data for UI
          const formattedList = list.map(item => ({
              ...item,
              avatar: item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.username || 'User')}`,
              replies: Array.isArray(item.replies) ? item.replies.map(r => ({
                  ...r,
                  avatar: r.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.username || 'User')}`
              })) : []
          }));

          setReviews(formattedList);
        } catch (err) {
          console.error('getReviews error', err);
          setFetchError(err.message || 'Failed to load reviews');
          setReviews([]);
        } finally {
          setLoading(false);
        }
      } else {
        setReviews([]);
      }
    };

    loadData();
  }, [pid, navigate]); 

  // Helper: Update Review State (Optimistic UI)
  const updateReviewState = (reviewId, reactionType, isReply = false, parentId = null) => {
      setReviews(prevReviews => {
          return prevReviews.map(review => {
              // Update Parent Review
              if (!isReply && review.id === reviewId) {
                  const isToggleOff = review.myReaction === reactionType;
                  return {
                      ...review,
                      myReaction: isToggleOff ? null : reactionType,
                      likes: isToggleOff ? (review.likes - 1) : (review.myReaction ? review.likes : review.likes + 1)
                  };
              }
              // Update Child Reply
              if (isReply && review.id === parentId && review.replies) {
                  return {
                      ...review,
                      replies: review.replies.map(reply => {
                          if (reply.id === reviewId) {
                              const isToggleOff = reply.myReaction === reactionType;
                              return {
                                  ...reply,
                                  myReaction: isToggleOff ? null : reactionType,
                                  likes: isToggleOff ? (reply.likes - 1) : (reply.myReaction ? reply.likes : reply.likes + 1)
                              };
                          }
                          return reply;
                      })
                  };
              }
              return review;
          });
      });
  };

  // Handler: Reaction Click
  const handleReact = async (targetId, reactionType, isReply = false, parentId = null) => {
    updateReviewState(targetId, reactionType, isReply, parentId); // Optimistic update

    if (pid) {
      try {
        await reviewService.upsertReaction(targetId, reactionType);
      } catch (err) {
        console.error('upsertReaction error', err);
        // Revert on error
        updateReviewState(targetId, reactionType, isReply, parentId);
      }
    }
  };

  // [NEW] Handler: Submit Reply
  const handleSubmitReply = async (reviewId) => {
      const content = replyInput[reviewId];
      if (!content || !content.trim()) return;

      try {
          const newReply = await reviewService.sendReply(reviewId, content);
          
          // Update UI with new reply
          setReviews(prev => prev.map(rev => {
              if (rev.id === reviewId) {
                  return {
                      ...rev,
                      replies: [...(rev.replies || []), newReply] 
                  };
              }
              return rev;
          }));

          // Clear input and close box
          setReplyInput(prev => ({ ...prev, [reviewId]: '' }));
          setActiveReplyId(null);
      } catch (err) {
          alert('Failed to post reply: ' + err.message);
      }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400 gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            fill={i < rating ? "currentColor" : "none"} 
            className={i < rating ? "text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  // Component: Reaction Button with Hover Dock
  const ReactionButton = ({ item, onReact, isReply = false, parentId = null }) => {
    const currentReaction = REACTION_TYPES.find(r => r.id === item.myReaction);

    return (
      <div className="relative group inline-block">
        {/* Hover Dock (Fixed Dead Zone with pb-2) */}
        <div className="absolute bottom-full left-0 hidden group-hover:block pb-2 z-20 min-w-max">
           <div className="bg-white shadow-xl rounded-full px-2 py-1 border border-gray-100 flex gap-2 animate-fade-in-up">
              {REACTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onReact(item.id, type.id, isReply, parentId)}
                  className="hover:scale-125 transition-transform text-2xl p-1 focus:outline-none select-none"
                  title={type.label}
                >
                  {type.icon}
                </button>
              ))}
           </div>
        </div>

        {/* Button */}
        <button 
          onClick={() => onReact(item.id, 'like', isReply, parentId)} 
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors py-1 ${currentReaction ? currentReaction.color : 'text-gray-500 hover:text-blue-600'}`}
        >
          {currentReaction ? (
             <span className="text-lg leading-none">{currentReaction.icon}</span>
          ) : (
             <ThumbsUp size={14} />
          )}
          <span>{item.likes > 0 ? item.likes : 'Helpful?'}</span>
          {currentReaction && <span className="text-xs font-normal text-gray-500">({currentReaction.label})</span>}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-baseline gap-4">
               <h1 className="text-xl font-bold text-gray-800 uppercase">PRODUCT REVIEWS</h1>
               <div className="flex items-center gap-2">
                  <span className="text-5xl font-bold text-gray-800">
                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                  </span>
                  <div className="flex flex-col">
                     {renderStars(reviews.length > 0 ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0)}
                     <span className="text-sm text-gray-400">out of 5</span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Select Product</span>
              <div className="relative">
                <select
                  value={pid || ''}
                  onChange={(e) => navigate(`/product/${e.target.value}/reviews`)}
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="" disabled>Select a product</option>
                  {products.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name} ({product.product_id})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="px-6 pb-6 pt-2 border-b border-gray-100">
             <div className="flex flex-wrap gap-2">
                 <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium">All ({reviews.length})</button>
                 <button className="px-4 py-1.5 border border-gray-200 bg-white text-gray-600 rounded text-sm hover:border-blue-500">5 Stars</button>
                 <button className="px-4 py-1.5 border border-gray-200 bg-white text-gray-600 rounded text-sm hover:border-blue-500">With Comments</button>
             </div>
          </div>

       {/* Review List */}
       <div>
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading reviews...</div>
        ) : fetchError ? (
          <div className="p-10 text-center text-red-500">{fetchError}</div>
        ) : !pid ? (
          <div className="p-10 text-center text-gray-500">Please select a product to view reviews.</div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No reviews yet for this product.</div>
        ) : (
          reviews.map((review) => (
           <div key={review.id} className="p-6 border-b border-gray-100 last:border-none">
            <div className="flex gap-4">
              {/* Avatar */}
              <img 
                src={review.avatar} 
                alt={review.username} 
                className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.username)}`; }}
              />

              {/* Content */}
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{review.username}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {review.date ? new Date(review.date).toLocaleString('en-US') : ''} 
                        {review.variant && ` | ${review.variant}`}
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                <div className="mt-3">
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.content}</div>
                </div>

                {/* Actions Row */}
                <div className="mt-3 flex items-center gap-6">
                  <ReactionButton item={review} onReact={handleReact} />
                  
                  {/* [NEW] Reply Button with Toggle Logic */}
                  <button 
                    onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)}
                    className={`flex items-center gap-1.5 text-sm font-medium hover:text-blue-600 ${activeReplyId === review.id ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    <MessageSquare size={14} />
                    <span>Reply</span>
                  </button>
                </div>

                {/* [NEW] Reply Input Box */}
                {activeReplyId === review.id && (
                    <div className="mt-4 flex gap-3 animate-fade-in-down pl-4 border-l-2 border-gray-100">
                        <div className="grow">
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                                placeholder="Write your reply..."
                                rows="2"
                                value={replyInput[review.id] || ''}
                                onChange={(e) => setReplyInput({ ...replyInput, [review.id]: e.target.value })}
                                autoFocus
                            />
                            <div className="flex justify-end mt-2 gap-2">
                                <button 
                                    onClick={() => setActiveReplyId(null)}
                                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSubmitReply(review.id)}
                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Post Reply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Replies List */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-md p-4 space-y-4 relative">
                    <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-50"></div>
                             
                    {review.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <img 
                            src={reply.avatar} 
                            alt={reply.username} 
                            className="w-8 h-8 rounded-full object-cover" 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reply.username)}`; }}
                        />
                        <div className="grow">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">{reply.username}</span>
                            <span className="text-xs text-gray-400">{reply.date ? new Date(reply.date).toLocaleString('en-US') : ''}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{reply.content}</p>
                          
                          <div className="mt-2 flex items-center gap-4">
                            <ReactionButton 
                                item={reply} 
                                onReact={handleReact} 
                                isReply={true} 
                                parentId={review.id} 
                            />
                            {/* Nested reply not implemented in this version, just a button for UI consistency */}
                            <button className="text-xs font-medium text-gray-500 hover:text-blue-600">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                   
              {/* More Options */}
              <button className="text-gray-300 hover:text-gray-600 h-fit">
                <MoreHorizontal size={18} />
              </button>
            </div>
           </div>
          ))
        )}
       </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductReviews;