$( () => {
    // Get current URL path
    const currentPath = window.location.pathname;
    
    // Remove leading slash if present
    const path = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
    
    // Find the corresponding link in the sidebar
    const menuLink = $('.nav-sidebar .nav-link[href="' + path + '"]');
    
    if (menuLink.length > 0) {
        // Add active class to the specific menu item
        menuLink.addClass('active');
        
        // Expand parent menu if it's inside a treeview
        const parentMenu = menuLink.closest('.nav-treeview').parent('.nav-item');
        if (parentMenu.length > 0) {
            parentMenu.addClass('menu-open');
            parentMenu.children('.nav-link').addClass('active');
        }
    } else {
        // If no direct match, try to match based on the beginning of the URL
        $('.nav-sidebar .nav-link').each(function() {
            const href = $(this).attr('href');
            if (href && href !== '#' && href !== '/' && currentPath.indexOf(href) === 0) {
                $(this).addClass('active');
                
                // Expand parent menu if it's inside a treeview
                const parentMenu = $(this).closest('.nav-treeview').parent('.nav-item');
                if (parentMenu.length > 0) {
                    parentMenu.addClass('menu-open');
                    parentMenu.children('.nav-link').addClass('active');
                }
                
                // Stop after finding the first match
                return false;
            }
        });
    }
});