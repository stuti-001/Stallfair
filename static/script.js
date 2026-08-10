document.addEventListener('DOMContentLoaded', () => {
    // Inject toast container dynamically
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Grab forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Function to display custom toast messages
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Pick appropriate styling / icon based on type
        const icon = type === 'success' ? '✦' : '⚠️';
        toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-message">${message}</span>`;
        
        toastContainer.appendChild(toast);

        // Micro-trigger transition
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Automatically hide and remove toast after 3.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3500);
    }

    // Login Form Submit handler
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {

            const emailInput = document.getElementById('login-email');
            const email = emailInput ? emailInput.value.trim() : '';

            if (email) {
                showToast(`Logging in as ${email}... Welcome back!`, 'success');
            } else {
                showToast('Please enter a valid email address.', 'error');
            }
        });
    }

    // Signup Form Submit handler
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
 
            const nameInput = document.getElementById('signup-name');
            const emailInput = document.getElementById('signup-email');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';

            if (name && email) {
                showToast(`Account created for ${name}! Checking credentials...`, 'success');
            } else {
                showToast('Please fill out all fields.', 'error');
            }
        });
    }

    // Optional visual enhancement: add custom focus outline behaviors or input effects
    const inputs = document.querySelectorAll('.input-field');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            // Optional glow effects can go here
        });
    });

    // --- Stallfair Home Page Interactions ---

    // 1. Browse Events Button Handler
    const browseBtn = document.getElementById('btn-browse');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            showToast('Loading latest maker markets and pop-ups...', 'success');
            // Smooth scroll down to the line-up section
            const lineupSection = document.querySelector('.lineup-section');
            if (lineupSection) {
                lineupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // 2. Category Pills Filter Logic
    const categoryPills = document.querySelectorAll('.category-pill');
    const lineupCards = document.querySelectorAll('.lineup-card');

    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const category = pill.getAttribute('data-category');
            const isActive = pill.classList.contains('active-pill');

            // Deactivate all pills
            categoryPills.forEach(p => {
                p.classList.remove('active-pill');
                p.style.transform = '';
                p.style.boxShadow = '';
            });

            if (isActive) {
                // Clear filter, show all cards
                lineupCards.forEach(card => {
                    card.style.display = 'flex';
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                });
                showToast('Showing all pop-up categories.', 'success');
            } else {
                // Activate clicked pill
                pill.classList.add('active-pill');
                // Apply a highlighted styling
                pill.style.transform = 'translateY(-2px) scale(1.05)';
                pill.style.boxShadow = '0 6px 16px rgba(46, 26, 8, 0.12)';

                // Filter cards
                let matchCount = 0;
                lineupCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (category === 'all' || cardCategory === category) {
                        card.style.display = 'flex';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                        matchCount++;
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 250);
                    }
                });

                showToast(`Filtered by ${category.charAt(0).toUpperCase() + category.slice(1)} (${matchCount} event${matchCount !== 1 ? 's' : ''} found)`, 'success');
            }
        });
    });

    // 3. Polaroid Card Interaction
    const polaroidCards = document.querySelectorAll('.polaroid-card');
    polaroidCards.forEach(card => {
        card.addEventListener('click', () => {
            const label = card.querySelector('.polaroid-label').textContent;
            showToast(`Opening booking details for ${label}!`, 'success');
        });
    });

    // 4. Line-up Card Click Mock Response
    lineupCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.lineup-card-title').textContent;
            const price = card.querySelector('.lineup-price').textContent;
            showToast(`Checking ticket availability for ${title} (${price})...`, 'success');
        });
    });

    // 5. Events Page Search Filter
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let matchCount = 0;

            lineupCards.forEach(card => {
                const title = card.querySelector('.lineup-card-title').textContent.toLowerCase();
                const meta = card.querySelector('.lineup-card-meta').textContent.toLowerCase();
                
                if (title.includes(query) || meta.includes(query)) {
                    card.style.display = 'flex';
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                    matchCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Update the results count element
            const countEl = document.getElementById('results-count');
            if (countEl) {
                countEl.textContent = matchCount;
            }
        });
    }

    // --- Stallfair Events Page Interactions ---
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    
    if (filterDropdowns.length > 0) {
        const eventRows = document.querySelectorAll('.event-row');
        const emptyState = document.getElementById('events-empty-state');

        // Helper function to close all dropdowns
        function closeAllDropdowns() {
            filterDropdowns.forEach(dropdown => {
                const btn = dropdown.querySelector('.filter-pill-btn');
                const menu = dropdown.querySelector('.filter-dropdown-menu');
                if (btn && menu) {
                    btn.setAttribute('aria-expanded', 'false');
                    menu.classList.remove('show');
                }
            });
        }

        // Toggle dropdown display
        filterDropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.filter-pill-btn');
            const menu = dropdown.querySelector('.filter-dropdown-menu');

            if (btn && menu) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
                    
                    // Close others
                    closeAllDropdowns();

                    if (!isExpanded) {
                        btn.setAttribute('aria-expanded', 'true');
                        menu.classList.add('show');
                    }
                });
            }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            closeAllDropdowns();
        });

        // Handle dropdown option selection
        filterDropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.filter-pill-btn');
            const labelSpan = btn ? btn.querySelector('.pill-btn-text') : null;
            const menu = dropdown.querySelector('.filter-dropdown-menu');
            const items = menu ? menu.querySelectorAll('.filter-dropdown-item') : [];

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Mark as active-item
                    items.forEach(i => i.classList.remove('active-item'));
                    item.classList.add('active-item');

                    // Update button text label
                    if (labelSpan) {
                        labelSpan.textContent = item.textContent.trim();
                    }

                    // Close menu
                    closeAllDropdowns();

                    // Apply filter logic
                    filterEvents();
                });
            });
        });

        // Filter events main logic
        function filterEvents() {
            // Get selected filter values
            const selectedLocation = getActiveValue('dropdown-location');
            const selectedDate = getActiveValue('dropdown-date');
            const selectedCategory = getActiveValue('dropdown-category');
            const selectedPrice = getActiveValue('dropdown-price');

            let visibleCount = 0;

            eventRows.forEach(row => {
                const rowLoc = row.getAttribute('data-location');
                const rowDate = row.getAttribute('data-date');
                const rowCat = row.getAttribute('data-category');
                const rowPrice = parseFloat(row.getAttribute('data-price'));

                let isVisible = true;

                // 1. Location match
                if (rowLoc !== selectedLocation) {
                    isVisible = false;
                }

                // 2. Date match
                if (selectedDate !== 'all' && rowDate !== selectedDate) {
                    isVisible = false;
                }

                // 3. Category match
                if (selectedCategory !== 'all' && rowCat !== selectedCategory) {
                    isVisible = false;
                }

                // 4. Price match
                if (selectedPrice !== 'all') {
                    if (selectedPrice === 'under-10' && rowPrice > 10) isVisible = false;
                    else if (selectedPrice === 'under-15' && rowPrice > 15) isVisible = false;
                    else if (selectedPrice === 'under-20' && rowPrice > 20) isVisible = false;
                }

                if (isVisible) {
                    row.style.display = 'flex';
                    // Trigger entry transition effect
                    row.style.opacity = '1';
                    row.style.transform = 'translateX(0)';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                    row.style.opacity = '0';
                }
            });

            // Handle empty state visibility
            if (emptyState) {
                emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
            }

            // Show toast feedback for filter action
            showToast(`Filters updated: ${visibleCount} event${visibleCount !== 1 ? 's' : ''} found`, 'success');
        }

        // Helper to get selected value
        function getActiveValue(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            const activeItem = dropdown ? dropdown.querySelector('.filter-dropdown-item.active-item') : null;
            return activeItem ? activeItem.getAttribute('data-value') : 'all';
        }

        // Click event row handler
        eventRows.forEach(row => {
            row.addEventListener('click', () => {
                const eventId = row.getAttribute('data-id') || '1';
                window.location.href = `/events/${eventId}/`;
            });
        });
    }

    // --- Stallfair Event Details Page Interactions ---
    const thumbnailBtns = document.querySelectorAll('.thumbnail-choice-btn');
    const mainDisplay = document.getElementById('details-main-display');
    const getTicketsBtn = document.getElementById('btn-get-tickets');

    if (thumbnailBtns.length > 0 && mainDisplay) {
        thumbnailBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                thumbnailBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');

                // Get selected color style
                const color = btn.getAttribute('data-color');
                
                // Clear existing color classes
                mainDisplay.classList.remove('block-gradient-gold', 'block-teal', 'block-orange');
                
                // Add new color class
                if (color === 'gold') {
                    mainDisplay.classList.add('block-gradient-gold');
                } else if (color === 'teal') {
                    mainDisplay.classList.add('block-teal');
                } else if (color === 'orange') {
                    mainDisplay.classList.add('block-orange');
                }

                showToast(`Switched showcase view.`, 'success');
            });
        });
    }

    if (getTicketsBtn) {
        getTicketsBtn.addEventListener('click', () => {
            showToast('Reserving your tickets for Sunrise Farmers Market... Done!', 'success');
        });
    }

    // --- Stallfair Organizer Desk (Event Management) Logic ---
    const eventCardsContainer = document.getElementById('event-cards-container');
    const btnNewCard = document.getElementById('btn-new-card');
    const editingBadgeText = document.getElementById('editing-badge-text');
    const editorTitleInput = document.getElementById('editor-title');
    const editorDateInput = document.getElementById('editor-date');
    const editorVenueInput = document.getElementById('editor-venue');
    const editorDescriptionInput = document.getElementById('editor-description');
    const btnSubmitPublish = document.getElementById('btn-submit-publish');
    const btnSubmitDraft = document.getElementById('btn-submit-draft');

    if (eventCardsContainer) {
        // Initial Mock Events Data State
        const mockEvents = [
            {
                id: '1',
                title: 'Sunrise Farmers Market',
                status: 'Published',
                date: 'Sat, 9 Aug',
                venue: 'Riverside Green',
                description: 'Forty local growers, a coffee cart, and the season\'s best produce...',
                pinColor: 'red',
                tickets: [
                    { name: 'General Entry', price: '$12.00' },
                    { name: 'Early Bird', price: '$18.00' },
                    { name: 'Family Pass', price: '$30.00' }
                ]
            },
            {
                id: '2',
                title: 'Craft Alley Pop-up',
                status: 'Published',
                date: 'Sat, 9 Aug',
                venue: 'Riverside Green',
                description: 'Handmade pottery, local art, prints, apparel and small-batch crafts.',
                pinColor: 'teal',
                tickets: [
                    { name: 'General Entry', price: '$5.00' },
                    { name: 'Workshop Pass', price: '$25.00' }
                ]
            },
            {
                id: '3',
                title: 'Rooftop Cinema Night',
                status: 'Draft',
                date: 'unscheduled',
                venue: 'TBD',
                description: 'Indie films under the stars. Bring your own blanket and snacks.',
                pinColor: 'yellow',
                tickets: [
                    { name: 'General Entry', price: '$15.00' },
                    { name: 'VIP Deckchair', price: '$25.00' }
                ]
            }
        ];

        let activeEventId = '1';

        // Function to render ticket tiers list
        const renderTicketTiers = (tickets) => {
            const container = document.getElementById('editor-ticket-tiers');
            if (!container) return;
            container.innerHTML = '';
            tickets.forEach((t) => {
                const item = document.createElement('div');
                item.className = 'ticket-tier-item';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'ticket-tier-name';
                nameSpan.textContent = t.name;
                
                const priceInput = document.createElement('input');
                priceInput.type = 'text';
                priceInput.className = 'ticket-tier-price-input';
                priceInput.value = t.price;
                priceInput.style.border = 'none';
                priceInput.style.background = 'transparent';
                priceInput.style.fontFamily = 'JetBrains Mono, monospace';
                priceInput.style.fontWeight = '500';
                priceInput.style.fontSize = '0.95rem';
                priceInput.style.color = 'var(--color-text-dark)';
                priceInput.style.textAlign = 'right';
                priceInput.style.width = '80px';
                priceInput.style.outline = 'none';
                priceInput.style.padding = '0';
                
                priceInput.addEventListener('input', (e) => {
                    t.price = e.target.value;
                });
                
                item.appendChild(nameSpan);
                item.appendChild(priceInput);
                container.appendChild(item);
            });
        };

        // Function to populate the editor form
        const populateEditor = (eventObj) => {
            if (!eventObj) return;
            if (editingBadgeText) editingBadgeText.textContent = `Editing · ${eventObj.title}`;
            if (editorTitleInput) editorTitleInput.value = eventObj.title;
            if (editorDateInput) editorDateInput.value = eventObj.date;
            if (editorVenueInput) editorVenueInput.value = eventObj.venue;
            if (editorDescriptionInput) editorDescriptionInput.value = eventObj.description;
            renderTicketTiers(eventObj.tickets);
        };

        // Function to render all cards in the list
        const renderCards = () => {
            eventCardsContainer.innerHTML = '';
            mockEvents.forEach(evt => {
                const card = document.createElement('div');
                card.className = `event-card ${evt.id === activeEventId ? 'active' : ''}`;
                card.setAttribute('data-id', evt.id);

                const pin = document.createElement('span');
                pin.className = `pin-dot pin-${evt.pinColor}`;
                
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                const title = document.createElement('h3');
                title.className = 'card-title';
                title.textContent = evt.title;

                const meta = document.createElement('p');
                meta.className = 'card-meta';
                const capitalizedStatus = evt.status.charAt(0).toUpperCase() + evt.status.slice(1);
                meta.textContent = `${capitalizedStatus} · ${evt.date}`;

                cardBody.appendChild(title);
                cardBody.appendChild(meta);
                card.appendChild(pin);
                card.appendChild(cardBody);

                card.addEventListener('click', () => {
                    activeEventId = evt.id;
                    // Update active styles
                    document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    populateEditor(evt);
                });

                eventCardsContainer.appendChild(card);
            });
        };

        // Real-time keyboard input updates
        const updateActiveCardRealTime = () => {
            const activeEvt = mockEvents.find(e => e.id === activeEventId);
            if (!activeEvt) return;

            if (editorTitleInput) {
                activeEvt.title = editorTitleInput.value;
                if (editingBadgeText) editingBadgeText.textContent = `Editing · ${activeEvt.title}`;
            }
            if (editorDateInput) activeEvt.date = editorDateInput.value;
            if (editorVenueInput) activeEvt.venue = editorVenueInput.value;
            if (editorDescriptionInput) activeEvt.description = editorDescriptionInput.value;

            // Find matching card and update text content directly to avoid full rerender (preserves cursor focus)
            const activeCard = eventCardsContainer.querySelector(`.event-card[data-id="${activeEventId}"]`);
            if (activeCard) {
                const titleEl = activeCard.querySelector('.card-title');
                const metaEl = activeCard.querySelector('.card-meta');
                if (titleEl) titleEl.textContent = activeEvt.title;
                if (metaEl) {
                    const capitalizedStatus = activeEvt.status.charAt(0).toUpperCase() + activeEvt.status.slice(1);
                    metaEl.textContent = `${capitalizedStatus} · ${activeEvt.date}`;
                }
            }
        };

        [editorTitleInput, editorDateInput, editorVenueInput, editorDescriptionInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updateActiveCardRealTime);
            }
        });

        // "+ New event card" button handler
        if (btnNewCard) {
            btnNewCard.addEventListener('click', () => {
                const newId = String(mockEvents.length + 1);
                const pinColors = ['red', 'teal', 'yellow'];
                const randomColor = pinColors[Math.floor(Math.random() * pinColors.length)];

                const newEvent = {
                    id: newId,
                    title: 'New Event Title',
                    status: 'Draft',
                    date: 'unscheduled',
                    venue: 'TBD',
                    description: 'Forty local growers, a coffee cart, and the season\'s best produce...',
                    pinColor: randomColor,
                    tickets: [
                        { name: 'General Entry', price: '$10.00' }
                    ]
                };

                mockEvents.push(newEvent);
                activeEventId = newId;
                renderCards();
                populateEditor(newEvent);
                showToast('New draft event card added to the corkboard!', 'success');
            });
        }

        // Action Buttons Submit handlers
        if (btnSubmitPublish) {
            btnSubmitPublish.addEventListener('click', (e) => {
 
                const activeEvt = mockEvents.find(e => e.id === activeEventId);
                if (activeEvt) {
                    activeEvt.status = 'Published';
                    renderCards();
                    showToast(`Event "${activeEvt.title}" has been successfully published!`, 'success');
                }
            });
        }

        if (btnSubmitDraft) {
            btnSubmitDraft.addEventListener('click', (e) => {
  
                const activeEvt = mockEvents.find(e => e.id === activeEventId);
                if (activeEvt) {
                    activeEvt.status = 'Draft';
                    renderCards();
                    showToast(`Draft for "${activeEvt.title}" has been saved.`, 'success');
                }
            });
        }

        // Initialize display
        renderCards();
        const initialActive = mockEvents.find(e => e.id === activeEventId);
        if (initialActive) {
            populateEditor(initialActive);
        }
    }
});






document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const submitBtn = document.getElementById('submitBtn');
  const submitText = submitBtn ? submitBtn.querySelector('.btn-submit__text') : null;
  const customerLoginLink = document.getElementById('customerLoginLink');

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(input, errorEl, message) {
    if (errorEl && input) {
      errorEl.textContent = message;
      input.classList.toggle('field__input--error', Boolean(message));
    }
  }

  function clearErrorOnInput(input, errorEl) {
    if (input && errorEl) {
      input.addEventListener('input', () => setError(input, errorEl, ''));
    }
  }

  clearErrorOnInput(emailInput, emailError);
  clearErrorOnInput(passwordInput, passwordError);

  form.addEventListener('submit', (event) => {
    let isValid = true;

    if (emailInput && emailError) {
      const email = emailInput.value.trim();
      if (!email) {
        setError(emailInput, emailError, 'Work email is required.');
        isValid = false;
      } else if (!EMAIL_PATTERN.test(email)) {
        setError(emailInput, emailError, 'Enter a valid email address.');
        isValid = false;
      }
    }

    if (passwordInput && passwordError) {
      const password = passwordInput.value;
      if (!password) {
        setError(passwordInput, passwordError, 'Password is required.');
        isValid = false;
      } else if (password.length < 8) {
        setError(passwordInput, passwordError, 'Password must be at least 8 characters.');
        isValid = false;
      }
    }

    if (!isValid) {
      event.preventDefault();
      return;
    }

    if (submitBtn) {
      setTimeout(() => {
        submitBtn.disabled = true;
      }, 0);
    }
    if (submitText) {
      submitText.textContent = 'Entering backstage...';
    }
  });

});