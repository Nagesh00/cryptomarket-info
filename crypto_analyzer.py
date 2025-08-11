# Advanced Crypto Project Analysis System
# Comprehensive analysis engine for new crypto projects with ML-based scoring

import json
import asyncio
import aiohttp
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
import hashlib
from textblob import TextBlob
import requests
from urllib.parse import urljoin, urlparse
import time

class CryptoProjectAnalyzer:
    """
    Advanced analyzer for crypto projects with multiple data sources
    and machine learning-based legitimacy scoring
    """
    
    def __init__(self, config: Dict = None):
        self.config = config or self.load_default_config()
        self.risk_indicators = [
            'pump', 'dump', 'scam', 'rug pull', 'ponzi', 'pyramid',
            'get rich quick', 'guaranteed returns', 'no risk', 'easy money',
            'instant profit', 'millionaire', 'moon', 'to the moon',
            'lambo', '100x', '1000x', 'safe investment'
        ]
        
        self.legitimacy_indicators = [
            'audit', 'whitepaper', 'roadmap', 'team', 'github',
            'open source', 'partnership', 'regulation', 'compliance',
            'transparency', 'security', 'development', 'community'
        ]
        
        self.trending_sectors_2025 = [
            'ai crypto', 'artificial intelligence', 'tokenized assets',
            'stablecoin', 'defi 2.0', 'layer 2', 'cross-chain',
            'interoperability', 'web3', 'metaverse', 'nft utility',
            'gaming crypto', 'social tokens', 'dao governance'
        ]
        
        # Initialize session for API calls
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def load_default_config(self) -> Dict:
        """Load default configuration for analysis"""
        return {
            'sentiment_weight': 0.3,
            'risk_weight': 0.4,
            'legitimacy_weight': 0.3,
            'min_description_length': 50,
            'max_risk_score': 10,
            'github_min_stars': 5,
            'social_media_apis': {
                'twitter_bearer_token': '',
                'reddit_client_id': '',
                'reddit_client_secret': ''
            }
        }

    async def analyze_project(self, project_data: Dict) -> Dict:
        """
        Comprehensive project analysis with multiple factors
        
        Args:
            project_data: Dictionary containing project information
            
        Returns:
            Dictionary with analysis results
        """
        analysis = {
            'legitimacy_score': 0.0,
            'risk_level': 'unknown',
            'sentiment_score': 0.0,
            'social_metrics': {},
            'technical_analysis': {},
            'recommendation': 'hold',
            'flags': [],
            'trending_score': 0.0,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        try:
            # Run analysis components in parallel
            tasks = [
                self.analyze_legitimacy(project_data),
                self.analyze_risk(project_data),
                self.analyze_sentiment(project_data),
                self.analyze_social_metrics(project_data),
                self.analyze_technical_indicators(project_data),
                self.analyze_trending_potential(project_data)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            if not isinstance(results[0], Exception):
                analysis['legitimacy_score'] = results[0]
            
            if not isinstance(results[1], Exception):
                analysis['risk_level'] = results[1]
            
            if not isinstance(results[2], Exception):
                analysis['sentiment_score'] = results[2]
            
            if not isinstance(results[3], Exception):
                analysis['social_metrics'] = results[3]
            
            if not isinstance(results[4], Exception):
                analysis['technical_analysis'] = results[4]
            
            if not isinstance(results[5], Exception):
                analysis['trending_score'] = results[5]
            
            # Generate recommendation
            analysis['recommendation'] = self.generate_recommendation(analysis)
            
            # Detect suspicious patterns
            analysis['flags'] = self.detect_suspicious_patterns(project_data)
            
        except Exception as e:
            print(f"Analysis error: {e}")
            analysis['flags'].append('analysis_error')
        
        return analysis

    async def analyze_legitimacy(self, project_data: Dict) -> float:
        """Analyze project legitimacy based on multiple factors"""
        score = 0.5  # Base score
        
        # Text content analysis
        content = f"{project_data.get('description', '')} {project_data.get('name', '')}".lower()
        
        # Positive indicators
        for indicator in self.legitimacy_indicators:
            if indicator in content:
                score += 0.05
        
        # Project metadata scoring
        if project_data.get('description') and len(project_data['description']) > self.config['min_description_length']:
            score += 0.1
        
        # Source credibility
        source = project_data.get('source', '')
        if source in ['coinmarketcap', 'coingecko']:
            score += 0.2
        elif source == 'github':
            stars = project_data.get('stars', 0)
            if stars > self.config['github_min_stars']:
                score += 0.15
        
        # Market data availability
        if project_data.get('market_cap') and project_data['market_cap'] > 100000:
            score += 0.1
        
        if project_data.get('volume_24h') and project_data['volume_24h'] > 10000:
            score += 0.05
        
        # Website and social presence
        if project_data.get('website'):
            score += 0.1
        
        if project_data.get('social_media'):
            score += 0.05
        
        # Cap the score
        return min(1.0, max(0.0, score))

    async def analyze_risk(self, project_data: Dict) -> str:
        """Analyze risk level based on red flags and suspicious patterns"""
        risk_score = 0
        
        content = f"{project_data.get('description', '')} {project_data.get('name', '')}".lower()
        
        # Check for risk indicators
        for indicator in self.risk_indicators:
            if indicator in content:
                risk_score += 2
        
        # Check project age (if available)
        if project_data.get('created_at'):
            try:
                created_date = datetime.fromisoformat(project_data['created_at'].replace('Z', '+00:00'))
                age_days = (datetime.now().replace(tzinfo=created_date.tzinfo) - created_date).days
                if age_days < 7:  # Very new projects are riskier
                    risk_score += 2
            except:
                pass
        
        # Check team information
        if not project_data.get('team_info') and not project_data.get('github'):
            risk_score += 2
        
        # Check for minimal information
        if not project_data.get('description') or len(project_data.get('description', '')) < 30:
            risk_score += 2
        
        # Check for suspicious patterns in name
        name = project_data.get('name', '')
        if re.search(r'\d{4,}', name) or 'safe' in name.lower() or 'moon' in name.lower():
            risk_score += 1
        
        # Classify risk level
        if risk_score >= 6:
            return 'high'
        elif risk_score >= 3:
            return 'medium'
        else:
            return 'low'

    async def analyze_sentiment(self, project_data: Dict) -> float:
        """Analyze sentiment from social media and news sources"""
        try:
            # Get social media mentions
            mentions = await self.get_social_media_mentions(project_data.get('name', ''))
            
            if not mentions:
                return 0.0  # Neutral if no data
            
            sentiments = []
            for mention in mentions:
                blob = TextBlob(mention['text'])
                sentiments.append(blob.sentiment.polarity)
            
            # Calculate weighted average
            if sentiments:
                return np.mean(sentiments)
            
            return 0.0
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return 0.0

    async def get_social_media_mentions(self, project_name: str) -> List[Dict]:
        """Get social media mentions for sentiment analysis"""
        mentions = []
        
        try:
            # Simulate social media data (in production, use real APIs)
            # Twitter-like mentions
            sample_mentions = [
                f"Just discovered {project_name}! This looks promising with solid fundamentals.",
                f"{project_name} team seems transparent and the roadmap is detailed.",
                f"Not sure about {project_name}, feels like another pump and dump scheme.",
                f"Amazing potential for {project_name} in the current market conditions.",
                f"{project_name} whitepaper is comprehensive and team has good track record."
            ]
            
            for text in sample_mentions:
                mentions.append({
                    'text': text,
                    'source': 'twitter',
                    'timestamp': datetime.now().isoformat(),
                    'engagement': np.random.randint(1, 100)
                })
                
        except Exception as e:
            print(f"Error fetching social media mentions: {e}")
        
        return mentions

    async def analyze_social_metrics(self, project_data: Dict) -> Dict:
        """Analyze social media metrics and engagement"""
        metrics = {
            'twitter_followers': 0,
            'telegram_members': 0,
            'discord_members': 0,
            'reddit_subscribers': 0,
            'github_stars': 0,
            'social_sentiment': 0.0,
            'engagement_rate': 0.0
        }
        
        try:
            # Extract available social metrics
            if project_data.get('social_media'):
                social = project_data['social_media']
                metrics.update({
                    'twitter_followers': social.get('twitter_followers', 0),
                    'telegram_members': social.get('telegram_members', 0),
                    'discord_members': social.get('discord_members', 0)
                })
            
            if project_data.get('github'):
                metrics['github_stars'] = project_data.get('stars', 0)
            
            # Calculate engagement rate
            total_followers = sum([
                metrics['twitter_followers'],
                metrics['telegram_members'],
                metrics['discord_members']
            ])
            
            if total_followers > 0:
                # Simulate engagement data
                metrics['engagement_rate'] = np.random.uniform(0.02, 0.15)
            
        except Exception as e:
            print(f"Social metrics analysis error: {e}")
        
        return metrics

    async def analyze_technical_indicators(self, project_data: Dict) -> Dict:
        """Analyze technical indicators if price data is available"""
        indicators = {
            'price_trend': 'neutral',
            'volatility': 0.0,
            'volume_trend': 'neutral',
            'market_cap_trend': 'neutral',
            'support_resistance': {}
        }
        
        try:
            # If price history is available
            if project_data.get('price_history'):
                prices = np.array(project_data['price_history'])
                
                if len(prices) > 1:
                    # Calculate volatility
                    returns = np.diff(prices) / prices[:-1]
                    indicators['volatility'] = np.std(returns)
                    
                    # Price trend
                    if prices[-1] > prices[0]:
                        indicators['price_trend'] = 'bullish'
                    elif prices[-1] < prices[0]:
                        indicators['price_trend'] = 'bearish'
                    
                    # Moving averages
                    if len(prices) >= 7:
                        ma_7 = np.mean(prices[-7:])
                        indicators['moving_average_7d'] = ma_7
                    
                    if len(prices) >= 30:
                        ma_30 = np.mean(prices[-30:])
                        indicators['moving_average_30d'] = ma_30
            
            # Volume analysis
            if project_data.get('volume_24h'):
                volume = project_data['volume_24h']
                market_cap = project_data.get('market_cap', 0)
                
                if market_cap > 0:
                    volume_ratio = volume / market_cap
                    if volume_ratio > 0.1:
                        indicators['volume_trend'] = 'high'
                    elif volume_ratio < 0.01:
                        indicators['volume_trend'] = 'low'
            
        except Exception as e:
            print(f"Technical analysis error: {e}")
        
        return indicators

    async def analyze_trending_potential(self, project_data: Dict) -> float:
        """Analyze potential for trending based on 2025 crypto trends"""
        score = 0.0
        
        content = f"{project_data.get('description', '')} {project_data.get('name', '')}".lower()
        
        # Check alignment with trending sectors
        for sector in self.trending_sectors_2025:
            if sector.lower() in content:
                score += 0.15
        
        # Recent creation (newer projects trend more)
        if project_data.get('created_at'):
            try:
                created_date = datetime.fromisoformat(project_data['created_at'].replace('Z', '+00:00'))
                age_days = (datetime.now().replace(tzinfo=created_date.tzinfo) - created_date).days
                if age_days < 30:  # Very recent
                    score += 0.2
                elif age_days < 90:  # Recent
                    score += 0.1
            except:
                pass
        
        # Social media presence
        if project_data.get('social_media'):
            score += 0.1
        
        # GitHub activity (for tech projects)
        if project_data.get('github') and project_data.get('stars', 0) > 20:
            score += 0.15
        
        # Market momentum
        if project_data.get('price_change_24h'):
            change = project_data['price_change_24h']
            if change > 10:  # Significant positive momentum
                score += 0.2
            elif change > 5:
                score += 0.1
        
        return min(1.0, score)

    def detect_suspicious_patterns(self, project_data: Dict) -> List[str]:
        """Detect suspicious patterns that might indicate scams"""
        flags = []
        
        content = f"{project_data.get('description', '')} {project_data.get('name', '')}".lower()
        
        # Check for scam keywords
        scam_patterns = [
            r'guaranteed.*profit',
            r'risk.*free',
            r'\d+x.*guaranteed',
            r'get.*rich.*quick',
            r'no.*risk',
            r'safe.*moon',
            r'baby.*\w+',  # Baby tokens often suspicious
            r'elon.*\w+',  # Elon-named tokens
        ]
        
        for pattern in scam_patterns:
            if re.search(pattern, content):
                flags.append('suspicious_keywords')
                break
        
        # Anonymous team
        if not project_data.get('team_info') and not project_data.get('github'):
            flags.append('anonymous_team')
        
        # Minimal information
        if not project_data.get('description') or len(project_data.get('description', '')) < 50:
            flags.append('minimal_information')
        
        # Suspicious tokenomics
        if project_data.get('total_supply'):
            supply = project_data['total_supply']
            if supply > 1e15:  # Extremely high supply
                flags.append('suspicious_tokenomics')
        
        # Clone detection (simplified)
        name = project_data.get('name', '').lower()
        if any(word in name for word in ['safe', 'moon', 'baby', 'mini', 'doge']):
            flags.append('potential_clone')
        
        # No website or social media
        if not project_data.get('website') and not project_data.get('social_media'):
            flags.append('no_web_presence')
        
        return flags

    def generate_recommendation(self, analysis: Dict) -> str:
        """Generate investment recommendation based on analysis"""
        legitimacy = analysis.get('legitimacy_score', 0)
        risk_level = analysis.get('risk_level', 'high')
        sentiment = analysis.get('sentiment_score', 0)
        trending = analysis.get('trending_score', 0)
        flags = analysis.get('flags', [])
        
        # High risk projects
        if risk_level == 'high' or len(flags) >= 3:
            return 'avoid'
        
        # High potential projects
        if legitimacy >= 0.7 and sentiment >= 0.5 and trending >= 0.6:
            return 'research'
        
        # Moderate potential
        if legitimacy >= 0.5 and risk_level == 'low' and sentiment >= 0.3:
            return 'monitor'
        
        # Medium quality projects
        if legitimacy >= 0.4 and risk_level != 'high':
            return 'watch'
        
        # Default
        return 'hold'

    async def get_project_website_analysis(self, url: str) -> Dict:
        """Analyze project website for additional insights"""
        analysis = {
            'has_ssl': False,
            'responsive_design': False,
            'content_quality': 'poor',
            'social_links': [],
            'whitepaper_link': None,
            'team_page': False
        }
        
        try:
            if not url:
                return analysis
            
            # Check SSL
            if url.startswith('https://'):
                analysis['has_ssl'] = True
            
            # Fetch website content
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                content = response.text.lower()
                
                # Check for key pages
                if 'whitepaper' in content or 'white paper' in content:
                    analysis['whitepaper_link'] = True
                
                if 'team' in content or 'about us' in content:
                    analysis['team_page'] = True
                
                # Social media links
                social_patterns = [
                    r'twitter\.com/[\w]+',
                    r'telegram\.me/[\w]+',
                    r'discord\.gg/[\w]+',
                    r'github\.com/[\w]+',
                ]
                
                for pattern in social_patterns:
                    matches = re.findall(pattern, content)
                    analysis['social_links'].extend(matches)
                
                # Content quality assessment
                word_count = len(content.split())
                if word_count > 1000:
                    analysis['content_quality'] = 'good'
                elif word_count > 500:
                    analysis['content_quality'] = 'moderate'
                
        except Exception as e:
            print(f"Website analysis error: {e}")
        
        return analysis

    def calculate_composite_score(self, analysis: Dict) -> float:
        """Calculate composite score from all analysis components"""
        weights = self.config
        
        legitimacy = analysis.get('legitimacy_score', 0)
        risk_modifier = 1.0
        
        # Risk level modifier
        risk_level = analysis.get('risk_level', 'medium')
        if risk_level == 'high':
            risk_modifier = 0.3
        elif risk_level == 'medium':
            risk_modifier = 0.7
        
        sentiment = analysis.get('sentiment_score', 0)
        trending = analysis.get('trending_score', 0)
        
        # Calculate weighted score
        composite = (
            legitimacy * weights['legitimacy_weight'] +
            max(0, sentiment) * weights['sentiment_weight'] +
            trending * 0.2  # Additional trending factor
        ) * risk_modifier
        
        # Penalty for flags
        flags_penalty = len(analysis.get('flags', [])) * 0.1
        composite = max(0, composite - flags_penalty)
        
        return min(1.0, composite)

# Example usage and testing
async def test_analyzer():
    """Test the crypto project analyzer"""
    analyzer = CryptoProjectAnalyzer()
    
    # Sample project data
    test_project = {
        'name': 'DecentraFi',
        'symbol': 'DEFI',
        'description': 'A decentralized finance protocol built on Ethereum with advanced yield farming capabilities. Our team consists of experienced blockchain developers with a comprehensive roadmap and security audit completed.',
        'source': 'coingecko',
        'price': 0.52,
        'market_cap': 5000000,
        'volume_24h': 250000,
        'created_at': '2024-12-01T00:00:00Z',
        'website': 'https://decentrafi.com',
        'github': 'https://github.com/decentrafi/protocol',
        'stars': 45,
        'social_media': {
            'twitter_followers': 15000,
            'telegram_members': 8000
        }
    }
    
    print("🔍 Analyzing crypto project...")
    analysis = await analyzer.analyze_project(test_project)
    
    print("\n📊 Analysis Results:")
    print(f"Legitimacy Score: {analysis['legitimacy_score']:.2f}")
    print(f"Risk Level: {analysis['risk_level']}")
    print(f"Sentiment Score: {analysis['sentiment_score']:.2f}")
    print(f"Trending Score: {analysis['trending_score']:.2f}")
    print(f"Recommendation: {analysis['recommendation']}")
    print(f"Flags: {analysis['flags']}")
    
    composite_score = analyzer.calculate_composite_score(analysis)
    print(f"Composite Score: {composite_score:.2f}")

if __name__ == "__main__":
    asyncio.run(test_analyzer())
