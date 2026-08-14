
# a ruby learning experience, port for ruby. 

#REQUIRES GOSU
gem install gosu
ruby fourier.rb

CX = 200
CY = 200
R  = 120

PANEL_SIZE   = 400
RIGHT_OFFSET = 420 
CONTROLS_TOP = 410

WINDOW_WIDTH  = RIGHT_OFFSET + PANEL_SIZE
WINDOW_HEIGHT = 480


# class
class FourierWindow < Gosu::Window
  def initialize
    super(WINDOW_WIDTH, WINDOW_HEIGHT)
    self.caption = "Fourier Series Drawer"

    @font = Gosu::Font.new(20)

    @n = 10 #number of draggable poitns in a circle. 
    @harmonics = @n / 2
    @points = []
    @playing = true

    @t = 0.0
    @trace = []
    @last_chain = nil
    @last_terms = nil

    @dragging = nil # :n_slider, :h_slider, point index, or nil

    init_circle
    @cache = compute_fourier

    # slider layout
    @n_slider = { x: 20,  y: CONTROLS_TOP, w: 200, min: 1, max: 20 }
    @h_slider = { x: 260, y: CONTROLS_TOP, w: 200, min: 1, max: @n }

    # buttons
    @reset_button = { x: 500, y: CONTROLS_TOP, w: 90, h: 30 }
    @pause_button = { x: 610, y: CONTROLS_TOP, w: 90, h: 30 }
  end



  def init_circle
    @points = []
    @n.times do |i| #this is a cool ruby thing. 
      angle = (i.to_f / @n) * 2 * Math::PI
      @points << { x: Math.cos(angle) * R, y: Math.sin(angle) * R }
    end
  end

  #DFT

  def compute_fourier
    n = @points.length
    coeffs = []
    n.times do |k|
      re = 0.0
      im = 0.0
      n.times do |m|
        angle = -2 * Math::PI * k * m / n.to_f
        cos = Math.cos(angle)
        sin = Math.sin(angle)
        re += @points[m][:x] * cos - @points[m][:y] * sin
        im += @points[m][:x] * sin + @points[m][:y] * cos
      end
      re /= n
      im /= n
      freq = k <= n / 2 ? k : k - n
      coeffs << { freq: freq, re: re, im: im }
    end
    coeffs.sort_by { |c| c[:freq].abs }
  end

  def recompute
    @cache = compute_fourier
  end

  def eval_at(t, terms)
    x = CX.to_f
    y = CY.to_f
    chain = [{ x: x, y: y }]
    terms.each do |term|
      angle = term[:freq] * t
      x += term[:re] * Math.cos(angle) - term[:im] * Math.sin(angle)
      y += term[:re] * Math.sin(angle) + term[:im] * Math.cos(angle)
      chain << { x: x, y: y }
    end
    chain
  end

  # update / draw 

  def update
    handle_dragging

    if @playing
      @t += 0.02
      terms = @cache.first(@harmonics)
      chain = eval_at(@t, terms)
      @last_chain = chain
      @last_terms = terms

      tip = chain.last
      @trace << tip
      @trace.shift if @trace.length > 700
    end
  end

  def draw
    draw_left_panel
    draw_right_panel
    draw_controls
  end

  def draw_left_panel
    # polygon connecting the points (closed path)
    @points.each_with_index do |p, i|
      nxt = @points[(i + 1) % @points.length]
      Gosu.draw_line(p[:x] + CX, p[:y] + CY, Gosu::Color::BLACK,
                      nxt[:x] + CX, nxt[:y] + CY, Gosu::Color::BLACK, 1)
    end

    # red squares at each point
    size = 8
    @points.each do |p|
      Gosu.draw_rect(p[:x] + CX - size / 2, p[:y] + CY - size / 2,
                      size, size, Gosu::Color::RED, 1)
    end
  end

  def draw_right_panel
    return unless @last_chain && @last_terms

    chain = @last_chain
    terms = @last_terms

    (chain.length - 1).times do |i|
      r = Math.hypot(terms[i][:re], terms[i][:im])
      draw_circle_outline(chain[i][:x] + RIGHT_OFFSET, chain[i][:y], r, Gosu::Color::GRAY)
      Gosu.draw_line(chain[i][:x] + RIGHT_OFFSET, chain[i][:y], Gosu::Color::RED,
                      chain[i + 1][:x] + RIGHT_OFFSET, chain[i + 1][:y], Gosu::Color::RED, 2)
    end

    blue = Gosu::Color::BLUE
    @trace.each_cons(2) do |a, b|
      Gosu.draw_line(a[:x] + RIGHT_OFFSET, a[:y], blue,
                      b[:x] + RIGHT_OFFSET, b[:y], blue, 2)
    end
  end

  def draw_circle_outline(cx, cy, radius, color, segments = 40)
    return if radius <= 0

    angle_step = 2 * Math::PI / segments
    segments.times do |i|
      a1 = i * angle_step
      a2 = (i + 1) * angle_step
      x1 = cx + radius * Math.cos(a1)
      y1 = cy + radius * Math.sin(a1)
      x2 = cx + radius * Math.cos(a2)
      y2 = cy + radius * Math.sin(a2)
      Gosu.draw_line(x1, y1, color, x2, y2, color, 1)
    end
  end
  def draw_controls
    # N slider
    draw_slider(@n_slider, @n)
    @font.draw_text("N: #{@n}", @n_slider[:x], @n_slider[:y] - 22, 1)

    # harmonics slider
    draw_slider(@h_slider, @harmonics)
    @font.draw_text("Harmonics: #{@harmonics}", @h_slider[:x], @h_slider[:y] - 22, 1)

    # reset button
    b = @reset_button
    Gosu.draw_rect(b[:x], b[:y], b[:w], b[:h], Gosu::Color::GRAY, 1)
    @font.draw_text("Reset", b[:x] + 15, b[:y] + 5, 2)

    # pause/play button
    b = @pause_button
    Gosu.draw_rect(b[:x], b[:y], b[:w], b[:h], Gosu::Color::GRAY, 1)
    @font.draw_text(@playing ? "Pause" : "Play", b[:x] + 15, b[:y] + 5, 2)
  end

  def draw_slider(slider, value)
    track_y = slider[:y] + 5
    Gosu.draw_rect(slider[:x], track_y, slider[:w], 4, Gosu::Color::GRAY, 1)

    frac = (value - slider[:min]).to_f / (slider[:max] - slider[:min])
    handle_x = slider[:x] + frac * slider[:w]
    Gosu.draw_rect(handle_x - 5, slider[:y] - 5, 10, 20, Gosu::Color::BLACK, 2)
  end

  #mouse interaction

  def button_down(id)
    if id == Gosu::MS_LEFT
      pos = { x: mouse_x, y: mouse_y }

      if hit?(@reset_button, pos)
        reset!
        return
      end

      if hit?(@pause_button, pos)
        @playing = !@playing
        return
      end

      if slider_hit?(@n_slider, pos)
        @dragging = :n_slider
        return
      end
      if slider_hit?(@h_slider, pos)
        @dragging = :h_slider
        return
      end
      # point dragging (left panel only)
      if pos[:x] >= 0 && pos[:x] <= PANEL_SIZE && pos[:y] >= 0 && pos[:y] <= PANEL_SIZE
        local = { x: pos[:x] - CX, y: pos[:y] - CY }
        @points.each_with_index do |p, i|
          if Math.hypot(p[:x] - local[:x], p[:y] - local[:y]) < 10
            @dragging = i
          end
        end
      end
    end
  end

  def button_up(id)
    @dragging = nil if id == Gosu::MS_LEFT
  end

  def handle_dragging
    return if @dragging.nil?

    case @dragging
    when :n_slider
      frac = ((mouse_x - @n_slider[:x]) / @n_slider[:w].to_f).clamp(0.0, 1.0)
      new_n = (@n_slider[:min] + frac * (@n_slider[:max] - @n_slider[:min])).round
      if new_n != @n
        @n = new_n
        init_circle
        @trace = []
        @h_slider[:max] = @n
        @harmonics = @n
        recompute
      end
    when :h_slider
      frac = ((mouse_x - @h_slider[:x]) / @h_slider[:w].to_f).clamp(0.0, 1.0)
      new_h = (@h_slider[:min] + frac * (@h_slider[:max] - @h_slider[:min])).round
      @harmonics = new_h if new_h != @harmonics
    when Integer
      local = { x: mouse_x - CX, y: mouse_y - CY }
      @points[@dragging] = local
      recompute
    end
  end

  def reset!
    init_circle
    recompute
  end

  def hit?(rect, pos)
    pos[:x] >= rect[:x] && pos[:x] <= rect[:x] + rect[:w] &&
      pos[:y] >= rect[:y] && pos[:y] <= rect[:y] + rect[:h]
  end

  def slider_hit?(slider, pos)
    pos[:x] >= slider[:x] - 5 && pos[:x] <= slider[:x] + slider[:w] + 5 &&
      pos[:y] >= slider[:y] - 10 && pos[:y] <= slider[:y] + 15
  end

  def needs_cursor?
    true
  end
end

FourierWindow.new.show
