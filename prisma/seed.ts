import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('<1 Starting seed...')

  // Week 5: Seed Analysis Templates
  console.log('=Ë Seeding analysis templates...')

  // Industry Templates
  const templates = [
    {
      name: 'Customer Feedback Analysis',
      description: 'Analyze customer satisfaction surveys with open-ended feedback. Perfect for NPS surveys, support tickets, and customer interviews.',
      category: 'industry',
      subcategory: 'customer_feedback',
      config: {
        expectedColumns: {
          numeric: ['nps_score', 'satisfaction_rating', 'rating', 'score'],
          text: ['comment', 'feedback', 'comments', 'response', 'open_ended'],
          categorical: ['customer_type', 'segment', 'plan', 'tier']
        },
        correlationTypes: ['numeric', 'thematic', 'sentiment'],
        insightCategories: ['opportunities', 'risks', 'customer_segments', 'action_items']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose your survey data and customer feedback documents',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Analysis',
          description: 'Map your data columns and select analysis depth',
          fields: ['scoreColumn', 'feedbackColumn', 'segmentColumn', 'analysisDepth']
        },
        step3: {
          title: 'Customize Insights',
          description: 'Select what insights you want AI to generate',
          fields: ['insightTypes', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review your configuration and start analysis',
          fields: ['name', 'description']
        }
      }
    },
    {
      name: 'Employee Survey Analysis',
      description: 'Analyze employee engagement surveys and feedback. Identify team health, retention risks, and improvement opportunities.',
      category: 'industry',
      subcategory: 'employee_survey',
      config: {
        expectedColumns: {
          numeric: ['engagement_score', 'satisfaction', 'rating', 'score'],
          text: ['feedback', 'comments', 'suggestions', 'concerns'],
          categorical: ['department', 'team', 'tenure', 'role', 'level']
        },
        correlationTypes: ['numeric', 'thematic', 'sentiment'],
        insightCategories: ['team_health', 'retention_risks', 'improvement_areas', 'strengths']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose your employee survey data and qualitative feedback',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Analysis',
          description: 'Map engagement metrics and employee segments',
          fields: ['engagementColumn', 'feedbackColumn', 'departmentColumn', 'analysisDepth']
        },
        step3: {
          title: 'Customize Insights',
          description: 'Choose what HR insights to generate',
          fields: ['insightTypes', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review configuration and start analysis',
          fields: ['name', 'description']
        }
      }
    },
    {
      name: 'Market Research Analysis',
      description: 'Analyze market research data combining purchase intent, demographics, and qualitative feedback. Discover market opportunities and competitive threats.',
      category: 'industry',
      subcategory: 'market_research',
      config: {
        expectedColumns: {
          numeric: ['purchase_intent', 'willingness_to_pay', 'feature_rating', 'score'],
          text: ['feedback', 'comments', 'why', 'reason', 'explanation'],
          categorical: ['age_group', 'income_bracket', 'location', 'segment']
        },
        correlationTypes: ['numeric', 'thematic', 'sentiment'],
        insightCategories: ['market_opportunities', 'competitive_threats', 'product_gaps', 'pricing']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose market research data and customer interviews',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Analysis',
          description: 'Map purchase intent and customer segments',
          fields: ['intentColumn', 'feedbackColumn', 'segmentColumn', 'analysisDepth']
        },
        step3: {
          title: 'Customize Insights',
          description: 'Select market insights to generate',
          fields: ['insightTypes', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review and start market analysis',
          fields: ['name', 'description']
        }
      }
    },
    {
      name: 'UX Research Analysis',
      description: 'Analyze usability testing data with user observations. Identify usability issues, design opportunities, and user pain points.',
      category: 'industry',
      subcategory: 'ux_research',
      config: {
        expectedColumns: {
          numeric: ['task_success_rate', 'time_on_task', 'sus_score', 'ease_rating'],
          text: ['observations', 'comments', 'pain_points', 'quotes', 'notes'],
          categorical: ['task', 'user_type', 'experience_level', 'device']
        },
        correlationTypes: ['numeric', 'thematic', 'sentiment'],
        insightCategories: ['usability_issues', 'design_opportunities', 'pain_points', 'delighters']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose usability metrics and user observations',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Analysis',
          description: 'Map success metrics and user feedback',
          fields: ['successColumn', 'observationColumn', 'taskColumn', 'analysisDepth']
        },
        step3: {
          title: 'Customize Insights',
          description: 'Select UX insights to generate',
          fields: ['insightTypes', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review and start UX analysis',
          fields: ['name', 'description']
        }
      }
    },

    // Methodology Templates
    {
      name: 'Grounded Theory Analysis',
      description: 'Emergent theme discovery from qualitative data. Start with minimal assumptions and let theories develop from your data.',
      category: 'methodology',
      subcategory: 'grounded_theory',
      config: {
        expectedColumns: {
          numeric: [],
          text: ['transcript', 'interview', 'response', 'text', 'content'],
          categorical: ['participant', 'session', 'group']
        },
        correlationTypes: ['thematic'],
        insightCategories: ['emergent_themes', 'core_categories', 'relationships', 'theory']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose qualitative data for grounded theory analysis',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Coding',
          description: 'Set up open coding and theme emergence parameters',
          fields: ['textColumn', 'minThemeFrequency', 'analysisDepth']
        },
        step3: {
          title: 'Customize Analysis',
          description: 'Configure theme clustering and category development',
          fields: ['codingApproach', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review and start grounded theory analysis',
          fields: ['name', 'description']
        }
      }
    },
    {
      name: 'Thematic Analysis with Sentiment',
      description: 'Identify patterns and themes with emotional context. Track theme frequency and sentiment across your qualitative data.',
      category: 'methodology',
      subcategory: 'thematic_sentiment',
      config: {
        expectedColumns: {
          numeric: ['rating', 'score'],
          text: ['text', 'comment', 'response', 'feedback', 'interview'],
          categorical: ['category', 'group', 'segment']
        },
        correlationTypes: ['thematic', 'sentiment'],
        insightCategories: ['theme_prevalence', 'sentiment_mapping', 'emotional_patterns', 'narrative']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose data for thematic and sentiment analysis',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Themes',
          description: 'Set theme extraction and sentiment parameters',
          fields: ['textColumn', 'numericColumn', 'themeCount', 'analysisDepth']
        },
        step3: {
          title: 'Customize Sentiment Analysis',
          description: 'Configure sentiment tracking and theme mapping',
          fields: ['sentimentGranularity', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review and start thematic sentiment analysis',
          fields: ['name', 'description']
        }
      }
    },
    {
      name: 'Mixed-Methods Sequential Design',
      description: 'Let quantitative data guide qualitative exploration. Use statistical findings to identify what needs deeper investigation.',
      category: 'methodology',
      subcategory: 'mixed_methods',
      config: {
        expectedColumns: {
          numeric: ['score', 'rating', 'value', 'metric'],
          text: ['explanation', 'comment', 'feedback', 'interview', 'response'],
          categorical: ['group', 'condition', 'segment']
        },
        correlationTypes: ['numeric', 'thematic', 'sentiment'],
        insightCategories: ['statistical_findings', 'qualitative_explanations', 'outlier_analysis', 'integrated_insights']
      },
      steps: {
        step1: {
          title: 'Select Data Sources',
          description: 'Choose quantitative and qualitative data sources',
          fields: ['dataset', 'document']
        },
        step2: {
          title: 'Configure Quantitative Analysis',
          description: 'Set numeric correlations and outlier detection',
          fields: ['primaryMetric', 'secondaryMetrics', 'outlierThreshold', 'analysisDepth']
        },
        step3: {
          title: 'Configure Qualitative Exploration',
          description: 'Map qualitative data to quantitative findings',
          fields: ['textColumn', 'narrativeTone', 'customQuestions']
        },
        step4: {
          title: 'Review & Launch',
          description: 'Review and start mixed-methods analysis',
          fields: ['name', 'description']
        }
      }
    }
  ]

  for (const template of templates) {
    await prisma.analysisTemplate.upsert({
      where: {
        // Create unique constraint based on name and category
        id: `${template.category}_${template.subcategory}`
      },
      update: {},
      create: {
        id: `${template.category}_${template.subcategory}`,
        ...template,
        userId: null, // System template
        isPublic: true,
        usageCount: 0
      }
    })
    console.log(`   Created template: ${template.name}`)
  }

  console.log(' Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('L Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
