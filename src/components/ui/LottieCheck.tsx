import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'

// URL da animação de check do LottieFiles
const CHECK_ANIMATION_URL = 'https://lottie.host/ecdb22b3-a733-400b-b668-ee3e22251145/a3V1DGcVz5.json'

interface LottieCheckProps {
  size?: number
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function LottieCheck({ size = 200, className = '', loop = false, autoplay = true }: LottieCheckProps) {
  const [animationData, setAnimationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega a animação do LottieFiles
    const loadAnimation = async () => {
      try {
        const response = await fetch(CHECK_ANIMATION_URL)
        if (response.ok) {
          const data = await response.json()
          setAnimationData(data)
        } else {
          // Fallback para animação inline se a URL falhar
          const checkData = {
      "v": "5.7.4",
      "fr": 60,
      "ip": 0,
      "op": 60,
      "w": 200,
      "h": 200,
      "nm": "Success Check",
      "ddd": 0,
      "assets": [],
      "layers": [
        {
          "ddd": 0,
          "ind": 1,
          "ty": 4,
          "nm": "Circle",
          "sr": 1,
          "ks": {
            "o": {
              "a": 1,
              "k": [
                {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [0]},
                {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 10, "s": [100]},
                {"t": 60, "s": [100]}
              ],
              "ix": 11
            },
            "r": {"a": 0, "k": 0, "ix": 10},
            "p": {"a": 0, "k": [100, 100, 0], "ix": 2},
            "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
            "s": {
              "a": 1,
              "k": [
                {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 0, "s": [0, 0, 100]},
                {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 15, "s": [115, 115, 100]},
                {"t": 25, "s": [100, 100, 100]}
              ],
              "ix": 6
            }
          },
          "ao": 0,
          "shapes": [
            {
              "ty": "gr",
              "it": [
                {
                  "d": 1,
                  "ty": "el",
                  "s": {"a": 0, "k": [180, 180], "ix": 2},
                  "p": {"a": 0, "k": [0, 0], "ix": 3},
                  "nm": "Ellipse Path 1",
                  "mn": "ADBE Vector Shape - Ellipse",
                  "hd": false
                },
                {
                  "ty": "fl",
                  "c": {"a": 0, "k": [0.2, 0.8, 0.4, 1], "ix": 4},
                  "o": {"a": 0, "k": 100, "ix": 5},
                  "r": 1,
                  "bm": 0,
                  "nm": "Fill 1",
                  "mn": "ADBE Vector Graphic - Fill",
                  "hd": false
                },
                {"ty": "tr", "p": {"a": 0, "k": [0, 0], "ix": 2}, "a": {"a": 0, "k": [0, 0], "ix": 1}, "s": {"a": 0, "k": [100, 100], "ix": 3}, "r": {"a": 0, "k": 0, "ix": 6}, "o": {"a": 0, "k": 100, "ix": 7}, "sk": {"a": 0, "k": 0, "ix": 4}, "sa": {"a": 0, "k": 0, "ix": 5}, "nm": "Transform"}
              ],
              "nm": "Ellipse 1",
              "np": 2,
              "cix": 2,
              "bm": 0,
              "ix": 1,
              "mn": "ADBE Vector Group",
              "hd": false
            }
          ],
          "ip": 0,
          "op": 60,
          "st": 0,
          "bm": 0
        },
        {
          "ddd": 0,
          "ind": 2,
          "ty": 4,
          "nm": "Check",
          "sr": 1,
          "ks": {
            "o": {
              "a": 1,
              "k": [
                {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 20, "s": [0]},
                {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 25, "s": [100]},
                {"t": 60, "s": [100]}
              ],
              "ix": 11
            },
            "r": {"a": 0, "k": 0, "ix": 10},
            "p": {"a": 0, "k": [100, 100, 0], "ix": 2},
            "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
            "s": {
              "a": 1,
              "k": [
                {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 20, "s": [0, 0, 100]},
                {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 30, "s": [100, 100, 100]},
                {"t": 60, "s": [100, 100, 100]}
              ],
              "ix": 6
            }
          },
          "ao": 0,
          "shapes": [
            {
              "ty": "gr",
              "it": [
                {
                  "ind": 0,
                  "ty": "sh",
                  "ix": 1,
                  "ks": {
                    "a": 0,
                    "k": {
                      "i": [[0, 0], [0, 0], [0, 0]],
                      "o": [[0, 0], [0, 0], [0, 0]],
                      "v": [[-35, -5], [-5, 25], [25, -25]],
                      "c": true
                    },
                    "ix": 2
                  },
                  "nm": "Path 1",
                  "mn": "ADBE Vector Shape - Group",
                  "hd": false
                },
                {
                  "ty": "st",
                  "c": {"a": 0, "k": [1, 1, 1, 1], "ix": 3},
                  "o": {"a": 0, "k": 100, "ix": 4},
                  "w": {"a": 0, "k": 22, "ix": 5},
                  "lc": 2,
                  "lj": 2,
                  "ml": 4,
                  "bm": 0,
                  "nm": "Stroke 1",
                  "mn": "ADBE Vector Graphic - Stroke",
                  "hd": false
                },
                {"ty": "tr", "p": {"a": 0, "k": [0, 0], "ix": 2}, "a": {"a": 0, "k": [0, 0], "ix": 1}, "s": {"a": 0, "k": [100, 100], "ix": 3}, "r": {"a": 0, "k": 0, "ix": 6}, "o": {"a": 0, "k": 100, "ix": 7}, "sk": {"a": 0, "k": 0, "ix": 4}, "sa": {"a": 0, "k": 0, "ix": 5}, "nm": "Transform"}
              ],
              "nm": "Check",
              "np": 2,
              "cix": 2,
              "bm": 0,
              "ix": 2,
              "mn": "ADBE Vector Group",
              "hd": false
            }
          ],
          "ip": 20,
          "op": 60,
          "st": 0,
          "bm": 0
        }
      ],
      "markers": []
    }
          setAnimationData(checkData)
        }
      } catch (error) {
        console.error('Erro ao carregar animação Lottie:', error)
        // Fallback para animação inline
        const checkData = {
          "v": "5.7.4",
          "fr": 60,
          "ip": 0,
          "op": 60,
          "w": 200,
          "h": 200,
          "nm": "Success Check",
          "ddd": 0,
          "assets": [],
          "layers": [
            {
              "ddd": 0,
              "ind": 1,
              "ty": 4,
              "nm": "Circle",
              "sr": 1,
              "ks": {
                "o": {
                  "a": 1,
                  "k": [
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [0]},
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 10, "s": [100]},
                    {"t": 60, "s": [100]}
                  ],
                  "ix": 11
                },
                "r": {"a": 0, "k": 0, "ix": 10},
                "p": {"a": 0, "k": [100, 100, 0], "ix": 2},
                "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
                "s": {
                  "a": 1,
                  "k": [
                    {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 0, "s": [0, 0, 100]},
                    {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 15, "s": [115, 115, 100]},
                    {"t": 25, "s": [100, 100, 100]}
                  ],
                  "ix": 6
                }
              },
              "ao": 0,
              "shapes": [
                {
                  "ty": "gr",
                  "it": [
                    {
                      "d": 1,
                      "ty": "el",
                      "s": {"a": 0, "k": [180, 180], "ix": 2},
                      "p": {"a": 0, "k": [0, 0], "ix": 3},
                      "nm": "Ellipse Path 1",
                      "mn": "ADBE Vector Shape - Ellipse",
                      "hd": false
                    },
                    {
                      "ty": "fl",
                      "c": {"a": 0, "k": [0.2, 0.8, 0.4, 1], "ix": 4},
                      "o": {"a": 0, "k": 100, "ix": 5},
                      "r": 1,
                      "bm": 0,
                      "nm": "Fill 1",
                      "mn": "ADBE Vector Graphic - Fill",
                      "hd": false
                    },
                    {"ty": "tr", "p": {"a": 0, "k": [0, 0], "ix": 2}, "a": {"a": 0, "k": [0, 0], "ix": 1}, "s": {"a": 0, "k": [100, 100], "ix": 3}, "r": {"a": 0, "k": 0, "ix": 6}, "o": {"a": 0, "k": 100, "ix": 7}, "sk": {"a": 0, "k": 0, "ix": 4}, "sa": {"a": 0, "k": 0, "ix": 5}, "nm": "Transform"}
                  ],
                  "nm": "Ellipse 1",
                  "np": 2,
                  "cix": 2,
                  "bm": 0,
                  "ix": 1,
                  "mn": "ADBE Vector Group",
                  "hd": false
                }
              ],
              "ip": 0,
              "op": 60,
              "st": 0,
              "bm": 0
            },
            {
              "ddd": 0,
              "ind": 2,
              "ty": 4,
              "nm": "Check",
              "sr": 1,
              "ks": {
                "o": {
                  "a": 1,
                  "k": [
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 20, "s": [0]},
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 25, "s": [100]},
                    {"t": 60, "s": [100]}
                  ],
                  "ix": 11
                },
                "r": {"a": 0, "k": 0, "ix": 10},
                "p": {"a": 0, "k": [100, 100, 0], "ix": 2},
                "a": {"a": 0, "k": [0, 0, 0], "ix": 1},
                "s": {
                  "a": 1,
                  "k": [
                    {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 20, "s": [0, 0, 100]},
                    {"i": {"x": [0.667, 0.667, 0.667], "y": [1, 1, 1]}, "o": {"x": [0.333, 0.333, 0.333], "y": [0, 0, 0]}, "t": 30, "s": [100, 100, 100]},
                    {"t": 60, "s": [100, 100, 100]}
                  ],
                  "ix": 6
                }
              },
              "ao": 0,
              "shapes": [
                {
                  "ty": "gr",
                  "it": [
                    {
                      "ind": 0,
                      "ty": "sh",
                      "ix": 1,
                      "ks": {
                        "a": 0,
                        "k": {
                          "i": [[0, 0], [0, 0], [0, 0]],
                          "o": [[0, 0], [0, 0], [0, 0]],
                          "v": [[-35, -5], [-5, 25], [25, -25]],
                          "c": true
                        },
                        "ix": 2
                      },
                      "nm": "Path 1",
                      "mn": "ADBE Vector Shape - Group",
                      "hd": false
                    },
                    {
                      "ty": "st",
                      "c": {"a": 0, "k": [1, 1, 1, 1], "ix": 3},
                      "o": {"a": 0, "k": 100, "ix": 4},
                      "w": {"a": 0, "k": 22, "ix": 5},
                      "lc": 2,
                      "lj": 2,
                      "ml": 4,
                      "bm": 0,
                      "nm": "Stroke 1",
                      "mn": "ADBE Vector Graphic - Stroke",
                      "hd": false
                    },
                    {"ty": "tr", "p": {"a": 0, "k": [0, 0], "ix": 2}, "a": {"a": 0, "k": [0, 0], "ix": 1}, "s": {"a": 0, "k": [100, 100], "ix": 3}, "r": {"a": 0, "k": 0, "ix": 6}, "o": {"a": 0, "k": 100, "ix": 7}, "sk": {"a": 0, "k": 0, "ix": 4}, "sa": {"a": 0, "k": 0, "ix": 5}, "nm": "Transform"}
                  ],
                  "nm": "Check",
                  "np": 2,
                  "cix": 2,
                  "bm": 0,
                  "ix": 2,
                  "mn": "ADBE Vector Group",
                  "hd": false
                }
              ],
              "ip": 20,
              "op": 60,
              "st": 0,
              "bm": 0
            }
          ],
          "markers": []
        }
        setAnimationData(checkData)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnimation()
  }, [])

  if (loading || !animationData) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

