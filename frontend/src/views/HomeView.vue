<template>
  <main class="landing-page page-bg">
    <section class="landing-shell">
      <div class="landing-copy">
        <p class="landing-kicker">EFREI CAMPUS PLATFORM</p>
        <h1>Find your room.<br /><span>Focus together.</span></h1>
        <p class="landing-lead">
          Discover available spaces, book a room in seconds and join study groups across every EFREI campus.
        </p>
        <div class="landing-actions">
          <RouterLink to="/register" class="landing-primary">Create an account <b aria-hidden="true">→</b></RouterLink>
          <RouterLink to="/login" class="landing-secondary">Log in</RouterLink>
        </div>
        <div class="landing-proof">
          <div><strong>4</strong><span>campuses</span></div>
          <div><strong>40</strong><span>room places</span></div>
          <div><strong>7</strong><span>days booking</span></div>
        </div>
      </div>

      <div class="landing-visual">
        <div class="landing-glow"></div>
        <div class="landing-window">
          <div class="window-bar"><span></span><span></span><span></span></div>
          <div class="window-content">
            <aside>
              <div class="window-logo">E</div>
              <span></span><span></span><span></span>
            </aside>
            <div class="window-main">
              <div class="window-heading"><p></p><b></b></div>
              <div class="window-stat-row"><i></i><i></i><i></i></div>
              <div class="window-campus">
                <div class="mini-corridor"></div>
                <div v-for="n in 8" :key="n" class="mini-room" :class="{ active: n === 3 || n === 7 }"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="floating-card floating-card-top">
          <span class="floating-icon">✓</span>
          <div><strong>Room K304</strong><small>Booking confirmed</small></div>
        </div>
        <div class="floating-card floating-card-bottom">
          <div class="floating-avatars"><span>A</span><span>M</span><span>+</span></div>
          <div><strong>Study group</strong><small>3 students joined</small></div>
        </div>
      </div>
    </section>
  </main>
</template>