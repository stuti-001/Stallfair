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
            e.preventDefault();

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!email && !password) {
                showToast('Please enter your email and password.', 'error');
                return;
            }
            if (!email) {
                showToast('Please enter your email address.', 'error');
                return;
            }
            if (!password) {
                showToast('Please enter your password.', 'error');
                return;
            }

            const csrfTokenInput = loginForm.querySelector('[name=csrfmiddlewaretoken]');
            const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

            const nextInput = loginForm.querySelector('[name=next]');
            const urlParams = new URLSearchParams(window.location.search);
            const nextValue = (nextInput ? nextInput.value : '') || urlParams.get('next') || '';

            const postData = {
                'action': 'login',
                'form_action': 'login',
                'username': email,
                'password': password
            };
            if (nextValue) {
                postData['next'] = nextValue;
            }

            const actionUrl = loginForm.getAttribute('action') || '/login/';
            fetch(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams(postData)
            })
            .then(async response => {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await response.json() : null;
                if (!response.ok) {
                    const errorMsg = data?.error || `Server returned error (${response.status}).`;
                    throw new Error(errorMsg);
                }
                return data;
            })
            .then(data => {
                if (data && data.success) {
                    showToast('Logged in successfully! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect || '/';
                    }, 1000);
                } else if (data) {
                    showToast(data.error || 'Login failed.', 'error');
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                const msg = (error && error.message && !error.message.includes('fetch') && !error.message.includes('NetworkError'))
                    ? error.message 
                    : 'Cannot connect to server. Please check if the Django server is running.';
                showToast(msg, 'error');
            });
        });
    }

    // Signup Form Submit handler
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
 
            const nameInput = document.getElementById('signup-name');
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            const confirmPasswordInput = document.getElementById('signup-confirm-password');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

            if (!name) {
                showToast('Please enter your full name.', 'error');
                return;
            }
            if (!email) {
                showToast('Please enter your email address.', 'error');
                return;
            }
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email) || email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
                showToast('Invalid email address format (e.g. name@example.com).', 'error');
                return;
            }
            if (!password) {
                showToast('Please enter a password.', 'error');
                return;
            }
            if (password.length < 8) {
                showToast('Password must be at least 8 characters long.', 'error');
                return;
            }
            if (!confirmPassword) {
                showToast('Please confirm your password.', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showToast('Passwords do not match. Please ensure both passwords match.', 'error');
                return;
            }

            const csrfTokenInput = signupForm.querySelector('[name=csrfmiddlewaretoken]');
            const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

            const signupActionUrl = signupForm.getAttribute('action') || '/login/';
            fetch(signupActionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams({
                    'action': 'signup',
                    'form_action': 'signup',
                    'fullname': name,
                    'email': email,
                    'password': password,
                    'confirm_password': confirmPassword
                })
            })
            .then(async response => {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                const data = isJson ? await response.json() : null;
                if (!response.ok) {
                    const errorMsg = data?.error || `Server returned error (${response.status}).`;
                    throw new Error(errorMsg);
                }
                return data;
            })
            .then(data => {
                if (data && data.success) {
                    showToast(data.message, 'success');
                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                    if (confirmPasswordInput) confirmPasswordInput.value = '';
                } else if (data) {
                    showToast(data.error || 'Signup failed.', 'error');
                }
            })
            .catch(error => {
                console.error('Error during signup:', error);
                const msg = (error && error.message && !error.message.includes('fetch') && !error.message.includes('NetworkError'))
                    ? error.message 
                    : 'Cannot connect to server. Please check if the Django server is running.';
                showToast(msg, 'error');
            });
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
        getTicketsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            let eventId = null;
            if (pathSegments[0] === 'events' && pathSegments[1] && !isNaN(pathSegments[1])) {
                eventId = pathSegments[1];
            }
            const targetUrl = eventId ? `/ticketbooking/${eventId}/` : '/ticketbooking/';
            showToast('Opening ticket selection...', 'success');
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 300);
        });
    }

    // --- Stallfair Ticket Booking Interactions ---
    const ticketCards = document.querySelectorAll('.ticket-tier-card');
    const summaryItemsContainer = document.getElementById('summary-items-container');
    const summaryTotalAmount = document.getElementById('summary-total-amount');
    const btnContinuePayment = document.getElementById('btn-continue-payment');
    const btnCancelBooking = document.getElementById('btn-cancel-booking');

    if (ticketCards.length > 0) {
        const ticketState = {};
        const BOOKING_FEE = 1.50;

        // Initialize state from DOM
        ticketCards.forEach(card => {
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name') || card.querySelector('.ticket-card-name')?.textContent.trim();
            const price = parseFloat(card.getAttribute('data-price')) || 0;
            const qtyEl = card.querySelector('.stepper-value');
            const initialQty = qtyEl ? parseInt(qtyEl.textContent.trim(), 10) || 0 : 0;

            ticketState[id] = {
                card,
                name,
                price,
                qty: initialQty,
                badgeEl: card.querySelector('.ticket-badge-selected'),
                qtyEl: qtyEl,
                plusBtn: card.querySelector('.btn-plus'),
                minusBtn: card.querySelector('.btn-minus')
            };

            // Minus button listener
            if (ticketState[id].minusBtn) {
                ticketState[id].minusBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (ticketState[id].qty > 0) {
                        ticketState[id].qty--;
                        updateTicketDisplay(id);
                        recalculateSummary();
                    }
                });
            }

            // Plus button listener
            if (ticketState[id].plusBtn) {
                ticketState[id].plusBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (ticketState[id].qty < 20) {
                        ticketState[id].qty++;
                        updateTicketDisplay(id);
                        recalculateSummary();
                    }
                });
            }
        });

        function updateTicketDisplay(id) {
            const item = ticketState[id];
            if (!item) return;

            // Update counter text
            if (item.qtyEl) item.qtyEl.textContent = item.qty;

            // Update card selected status and badge
            if (item.qty > 0) {
                item.card.classList.add('selected');
                if (item.badgeEl) item.badgeEl.style.display = 'inline-block';
                if (item.plusBtn) item.plusBtn.classList.add('active-fill');
            } else {
                item.card.classList.remove('selected');
                if (item.badgeEl) item.badgeEl.style.display = 'none';
                if (item.plusBtn) item.plusBtn.classList.remove('active-fill');
            }
        }

        function recalculateSummary() {
            if (!summaryItemsContainer || !summaryTotalAmount) return;

            summaryItemsContainer.innerHTML = '';
            let subtotal = 0;
            let totalTicketsCount = 0;

            Object.keys(ticketState).forEach(id => {
                const item = ticketState[id];
                if (item.qty > 0) {
                    totalTicketsCount += item.qty;
                    const itemTotal = item.qty * item.price;
                    subtotal += itemTotal;

                    const row = document.createElement('div');
                    row.className = 'summary-item-row';
                    row.setAttribute('data-id', id);
                    row.innerHTML = `
                        <span class="item-title">${item.name} ×${item.qty}</span>
                        <span class="item-cost">$${itemTotal.toFixed(2)}</span>
                    `;
                    summaryItemsContainer.appendChild(row);
                }
            });

            const emptyStateEl = document.getElementById('summary-empty-state');

            if (totalTicketsCount > 0) {
                if (emptyStateEl) emptyStateEl.style.display = 'none';

                // Add booking fee row
                const feeRow = document.createElement('div');
                feeRow.className = 'summary-item-row fee-row';
                feeRow.id = 'summary-fee-row';
                feeRow.innerHTML = `
                    <span class="item-title text-muted">Booking fee</span>
                    <span class="item-cost">$${BOOKING_FEE.toFixed(2)}</span>
                `;
                summaryItemsContainer.appendChild(feeRow);

                const grandTotal = subtotal + BOOKING_FEE;
                summaryTotalAmount.textContent = `$${grandTotal.toFixed(2)}`;
            } else {
                if (emptyStateEl) emptyStateEl.style.display = 'block';
                summaryTotalAmount.textContent = '$0.00';
            }
        }

        // Cancel button interaction: navigate back to event details
        if (btnCancelBooking) {
            btnCancelBooking.addEventListener('click', (e) => {
                if (!btnCancelBooking.getAttribute('href') || btnCancelBooking.getAttribute('href') === '#') {
                    e.preventDefault();
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        window.location.href = '/events/1/';
                    }
                }
            });
        }

        // Continue to payment button interaction
        if (btnContinuePayment) {
            btnContinuePayment.addEventListener('click', () => {
                let totalTickets = 0;
                Object.values(ticketState).forEach(item => totalTickets += item.qty);

                if (totalTickets === 0) {
                    showToast('Please select at least 1 ticket to proceed.', 'error');
                    return;
                }

                const totalStr = summaryTotalAmount ? summaryTotalAmount.textContent : '$0.00';
                showToast(`Proceeding to payment (${totalStr})... Reserving your spots!`, 'success');
            });
        }

        // Initial summary render
        recalculateSummary();
    }

    // --- Stallfair Ticket Wallet (myticket.html) & My Tickets Nav Handler ---
    const ticketNavItems = document.querySelectorAll('.ticket-item');
    ticketNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // If already on myticket page, let it be or smooth scroll
            if (window.location.pathname.includes('/myticket')) {
                return;
            }
            e.preventDefault();
            window.location.href = '/myticket/';
        });
    });

    const walletTabPills = document.querySelectorAll('.wallet-tab-pill');
    const viewUpcoming = document.getElementById('view-upcoming');
    const viewPast = document.getElementById('view-past');

    if (walletTabPills.length > 0) {
        walletTabPills.forEach(pill => {
            pill.addEventListener('click', () => {
                walletTabPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const targetTab = pill.getAttribute('data-tab');
                if (targetTab === 'upcoming') {
                    if (viewUpcoming) viewUpcoming.style.display = 'block';
                    if (viewPast) viewPast.style.display = 'none';
                    showToast('Showing upcoming event tickets (3).', 'success');
                } else if (targetTab === 'past') {
                    if (viewUpcoming) viewUpcoming.style.display = 'none';
                    if (viewPast) viewPast.style.display = 'block';
                    showToast('Showing past event tickets.', 'success');
                }
            });
        });

        const walletTicketCards = document.querySelectorAll('.wallet-ticket-card');
        walletTicketCards.forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('.ticket-event-heading')?.textContent.trim() || 'Ticket';
                showToast(`Viewing digital pass for ${title}! Present at entrance.`, 'success');
            });
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
    const editorCategorySelect = document.getElementById('editor-category');
    const editorTimeInput = document.getElementById('editor-time');
    const btnSubmitPublish = document.getElementById('btn-submit-publish');
    const btnSubmitDraft = document.getElementById('btn-submit-draft');
    const btnSubmitDelete = document.getElementById('btn-submit-delete');

    if (eventCardsContainer) {
        let mockEvents = [
            {
                id: '1',
                title: 'Sunrise Farmers Market',
                status: 'Published',
                date: 'Sat, 9 Aug',
                time: '7:00-11:00am',
                venue: 'Riverside Green',
                category: 'Food & Produce',
                description: 'Forty local growers, a coffee cart, and the season\'s best produce...',
                pinColor: 'red',
                tickets: [
                    { name: 'General Ticket', price: '$12.00' }
                ]
            },
            {
                id: '2',
                title: 'Craft Alley Pop-up',
                status: 'Published',
                date: 'Sat, 9 Aug',
                time: '12:00-6:00pm',
                venue: 'Riverside Green',
                category: 'Craft',
                description: 'Handmade pottery, local art, prints, apparel and small-batch crafts.',
                pinColor: 'teal',
                tickets: [
                    { name: 'General Ticket', price: '$5.00' }
                ]
            },
            {
                id: '3',
                title: 'Rooftop Cinema Night',
                status: 'Draft',
                date: 'unscheduled',
                time: '6:00-11:00pm',
                venue: 'TBD',
                category: 'Art Happening',
                description: 'Indie films under the stars. Bring your own blanket and snacks.',
                pinColor: 'yellow',
                tickets: [
                    { name: 'General Ticket', price: '$15.00' }
                ]
            }
        ];

        const serverEventsEl = document.getElementById('server-events-data');
        if (serverEventsEl && serverEventsEl.textContent) {
            try {
                const parsedDbEvents = JSON.parse(serverEventsEl.textContent);
                if (Array.isArray(parsedDbEvents) && parsedDbEvents.length > 0) {
                    mockEvents = parsedDbEvents;
                }
            } catch (err) {
                console.warn('Could not parse server events data:', err);
            }
        }

        let activeEventId = mockEvents[0]?.id || '1';

        const updateButtonVisibility = (eventObj) => {
            const isPublished = eventObj && eventObj.status && eventObj.status.toLowerCase() === 'published';
            if (btnSubmitDraft) {
                btnSubmitDraft.style.display = isPublished ? 'none' : 'inline-block';
            }
            if (btnSubmitDelete) {
                btnSubmitDelete.style.display = isPublished ? 'inline-block' : 'none';
            }
        };

        // Function to render ticket tiers list
        const renderTicketTiers = (tickets) => {
            const container = document.getElementById('editor-ticket-tiers');
            if (!container) return;
            container.innerHTML = '';
            
            // Ensure only one General Ticket type is rendered
            const ticketList = (tickets && tickets.length > 0) 
                ? [{ name: 'General Ticket', price: tickets[0].price || '$10.00' }]
                : [{ name: 'General Ticket', price: '$10.00' }];

            ticketList.forEach((t) => {
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
                    const activeEvt = mockEvents.find(evt => evt.id === activeEventId);
                    if (activeEvt && activeEvt.tickets && activeEvt.tickets.length > 0) {
                        activeEvt.tickets[0].price = e.target.value;
                    }
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
            if (editorCategorySelect) editorCategorySelect.value = eventObj.category || 'Food & Produce';
            if (editorTimeInput) editorTimeInput.value = eventObj.time || '7:00-11:00am';
            renderTicketTiers(eventObj.tickets);
            updateButtonVisibility(eventObj);
        };

        // Function to render all cards in the list
        const renderCards = () => {
            eventCardsContainer.innerHTML = '';
            mockEvents.forEach(evt => {
                const card = document.createElement('div');
                card.className = `event-card ${evt.id === activeEventId ? 'active' : ''}`;
                card.setAttribute('data-id', evt.id);

                const pin = document.createElement('span');
                pin.className = `pin-dot pin-${evt.pinColor || 'red'}`;
                
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                const title = document.createElement('h3');
                title.className = 'card-title';
                title.textContent = evt.title;

                const meta = document.createElement('p');
                meta.className = 'card-meta';
                const capitalizedStatus = evt.status ? (evt.status.charAt(0).toUpperCase() + evt.status.slice(1)) : 'Published';
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
            if (editorCategorySelect) activeEvt.category = editorCategorySelect.value;
            if (editorTimeInput) activeEvt.time = editorTimeInput.value;

            // Find matching card and update text content directly to avoid full rerender (preserves cursor focus)
            const activeCard = eventCardsContainer.querySelector(`.event-card[data-id="${activeEventId}"]`);
            if (activeCard) {
                const titleEl = activeCard.querySelector('.card-title');
                const metaEl = activeCard.querySelector('.card-meta');
                if (titleEl) titleEl.textContent = activeEvt.title;
                if (metaEl) {
                    const capitalizedStatus = activeEvt.status ? (activeEvt.status.charAt(0).toUpperCase() + activeEvt.status.slice(1)) : 'Published';
                    metaEl.textContent = `${capitalizedStatus} · ${activeEvt.date}`;
                }
            }
        };

        [editorTitleInput, editorDateInput, editorVenueInput, editorDescriptionInput, editorCategorySelect, editorTimeInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updateActiveCardRealTime);
                input.addEventListener('change', updateActiveCardRealTime);
            }
        });

        // "+ New event card" button handler
        if (btnNewCard) {
            btnNewCard.addEventListener('click', () => {
                const newId = 'new-' + Date.now();
                const pinColors = ['red', 'teal', 'yellow'];
                const randomColor = pinColors[Math.floor(Math.random() * pinColors.length)];

                const newEvent = {
                    id: newId,
                    title: 'New Event Title',
                    status: 'Draft',
                    date: 'Sat, 9 Aug',
                    time: '10:00am-4:00pm',
                    venue: 'Riverside Green',
                    category: 'Community & Workshop',
                    description: 'A brand new maker and community event in town.',
                    pinColor: randomColor,
                    tickets: [
                        { name: 'General Ticket', price: '$10.00' }
                    ]
                };

                mockEvents.push(newEvent);
                activeEventId = newId;
                renderCards();
                populateEditor(newEvent);
                showToast('New event card added to the corkboard. Fill details and click "Publish event" to save!', 'success');
            });
        }

        // Save event to backend API
        const saveEventToBackend = async (status = 'Published') => {
            const form = document.getElementById('event-editor-form');
            const title = editorTitleInput ? editorTitleInput.value.trim() : '';
            const date = editorDateInput ? editorDateInput.value.trim() : '';
            const venue = editorVenueInput ? editorVenueInput.value.trim() : '';
            const description = editorDescriptionInput ? editorDescriptionInput.value.trim() : '';
            const category = editorCategorySelect ? editorCategorySelect.value : 'Food & Produce';
            const time = editorTimeInput ? editorTimeInput.value.trim() : '7:00-11:00am';

            if (!title) {
                showToast('Please enter an event title.', 'error');
                if (editorTitleInput) editorTitleInput.focus();
                return;
            }

            const csrfTokenInput = form ? form.querySelector('[name=csrfmiddlewaretoken]') : null;
            const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

            if (btnSubmitPublish) {
                btnSubmitPublish.disabled = true;
                btnSubmitPublish.textContent = 'Publishing...';
            }

            const postData = {
                title: title,
                date: date,
                venue: venue,
                location: venue,
                time: time,
                category: category,
                description: description,
                status: status
            };

            const actionUrl = form ? form.getAttribute('action') || '/event-management/' : '/event-management/';

            try {
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: new URLSearchParams(postData)
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Server error creating event.');
                }

                showToast(data.message || `Event "${title}" published successfully!`, 'success');

                // Update active event in corkboard
                const activeEvt = mockEvents.find(e => e.id === activeEventId);
                if (activeEvt) {
                    activeEvt.status = status;
                    if (data.event && data.event.id) {
                        activeEvt.id = String(data.event.id);
                        activeEventId = activeEvt.id;
                    }
                } else if (data.event) {
                    mockEvents.push({
                        id: String(data.event.id),
                        title: data.event.title,
                        status: status,
                        date: data.event.date,
                        time: data.event.time,
                        venue: data.event.location,
                        category: data.event.category,
                        description: data.event.description,
                        pinColor: 'red',
                        tickets: [{ name: 'General Ticket', price: '$12.00' }]
                    });
                    activeEventId = String(data.event.id);
                }

                renderCards();
                const updatedEvt = mockEvents.find(e => e.id === activeEventId);
                updateButtonVisibility(updatedEvt);

            } catch (err) {
                console.error('Error saving event:', err);
                showToast(err.message || 'Error publishing event.', 'error');
            } finally {
                if (btnSubmitPublish) {
                    btnSubmitPublish.disabled = false;
                    btnSubmitPublish.textContent = 'Publish event';
                }
            }
        };

        // Delete event from backend API
        const deleteEventFromBackend = async () => {
            const activeEvt = mockEvents.find(e => e.id === activeEventId);
            if (!activeEvt) return;

            const title = activeEvt.title;
            const form = document.getElementById('event-editor-form');
            const csrfTokenInput = form ? form.querySelector('[name=csrfmiddlewaretoken]') : null;
            const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

            if (btnSubmitDelete) {
                btnSubmitDelete.disabled = true;
                btnSubmitDelete.textContent = 'Deleting...';
            }

            try {
                const postData = {
                    action: 'delete',
                    event_id: activeEvt.id,
                    id: activeEvt.id,
                    title: title
                };

                const response = await fetch(`/delete-event/${activeEvt.id}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: new URLSearchParams(postData)
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Server error deleting event.');
                }

                showToast(data.message || `Event "${title}" permanently deleted from database.`, 'success');

                // Remove from mockEvents list
                mockEvents = mockEvents.filter(e => e.id !== activeEventId);

                if (mockEvents.length > 0) {
                    activeEventId = mockEvents[0].id;
                    renderCards();
                    populateEditor(mockEvents[0]);
                } else {
                    const defaultEvent = {
                        id: 'new-' + Date.now(),
                        title: 'New Event Title',
                        status: 'Draft',
                        date: 'Sat, 9 Aug',
                        time: '10:00am-4:00pm',
                        venue: 'Riverside Green',
                        category: 'Community & Workshop',
                        description: 'A brand new event.',
                        pinColor: 'red',
                        tickets: [{ name: 'General Ticket', price: '$10.00' }]
                    };
                    mockEvents.push(defaultEvent);
                    activeEventId = defaultEvent.id;
                    renderCards();
                    populateEditor(defaultEvent);
                }

            } catch (err) {
                console.error('Error deleting event:', err);
                showToast(err.message || 'Error deleting event.', 'error');
            } finally {
                if (btnSubmitDelete) {
                    btnSubmitDelete.disabled = false;
                    btnSubmitDelete.textContent = 'Delete Event';
                }
            }
        };

        // Form submit handler
        const editorForm = document.getElementById('event-editor-form');
        if (editorForm) {
            editorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveEventToBackend('Published');
            });
        }

        // Action Buttons Submit handlers
        if (btnSubmitPublish) {
            btnSubmitPublish.addEventListener('click', (e) => {
                e.preventDefault();
                saveEventToBackend('Published');
            });
        }

        if (btnSubmitDraft) {
            btnSubmitDraft.addEventListener('click', (e) => {
                e.preventDefault();
                const activeEvt = mockEvents.find(e => e.id === activeEventId);
                if (activeEvt) {
                    activeEvt.status = 'Draft';
                    renderCards();
                    updateButtonVisibility(activeEvt);
                    showToast(`Draft for "${activeEvt.title}" has been saved.`, 'success');
                }
            });
        }

        if (btnSubmitDelete) {
            btnSubmitDelete.addEventListener('click', (e) => {
                e.preventDefault();
                deleteEventFromBackend();
            });
        }

        // Initialize display
        renderCards();
        const initialActive = mockEvents.find(e => e.id === activeEventId) || mockEvents[0];
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

  // Profile Form Handler
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullnameInput = document.getElementById('profile-fullname');
      const emailInput = document.getElementById('profile-email');
      const phoneInput = document.getElementById('profile-phone');
      const cityInput = document.getElementById('profile-city');
      const saveBtn = document.getElementById('btn-save-profile');

      const fullname = fullnameInput ? fullnameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() : '';

      if (!fullname) {
        showToast('Please enter your full name.', 'error');
        return;
      }
      if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email) || email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
        showToast('Invalid email address format (e.g. name@example.com).', 'error');
        return;
      }

      const csrfTokenInput = profileForm.querySelector('[name=csrfmiddlewaretoken]');
      const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      const postData = {
        fullname: fullname,
        email: email,
        phone: phone,
        city: city
      };

      const actionUrl = profileForm.getAttribute('action') || window.location.pathname;

      fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(postData)
      })
      .then(async (response) => {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;
        if (!response.ok) {
          const errorMsg = data?.error || `Server returned error (${response.status}).`;
          throw new Error(errorMsg);
        }
        return data;
      })
      .then((data) => {
        if (data && data.success) {
          showToast(data.message || 'Profile updated successfully!', 'success');
          const displayProfileName = document.getElementById('display-profile-name');
          if (displayProfileName && data.fullname) {
            displayProfileName.textContent = data.fullname;
          }
          const avatarInitial = document.querySelector('.profile-avatar-initial');
          if (avatarInitial && data.fullname) {
            avatarInitial.textContent = data.fullname.charAt(0).toUpperCase();
          }
        } else {
          showToast(data?.error || 'Failed to update profile.', 'error');
        }
      })
      .catch((err) => {
        showToast(err.message || 'An unexpected error occurred.', 'error');
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save changes';
        }
      });
    });
  }

});